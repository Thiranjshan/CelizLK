[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9.-]+$')]
  [string]$HostName,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$SshUser,

  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$IdentityFile,

  [Parameter(Mandatory = $true)]
  [string]$LocalDirectory,

  [ValidateRange(1, 3650)]
  [int]$LocalRetentionDays = 90
)

$ErrorActionPreference = 'Stop'
$ssh = Get-Command ssh -ErrorAction Stop
$scp = Get-Command scp -ErrorAction Stop
$remoteHost = "$SshUser@$HostName"
$sshOptions = @(
  '-o', 'BatchMode=yes',
  '-o', 'StrictHostKeyChecking=yes',
  '-i', $IdentityFile
)

New-Item -ItemType Directory -Force -Path $LocalDirectory | Out-Null
$LocalDirectory = (Resolve-Path -LiteralPath $LocalDirectory).Path

function Get-RemoteCompletedFiles {
  param(
    [Parameter(Mandatory = $true)][string]$RemoteDirectory,
    [Parameter(Mandatory = $true)][string]$Pattern
  )

  $command = "find '$RemoteDirectory' -maxdepth 1 -type f -name '$($Pattern).complete' -printf '%f\n' | sort"
  $result = & $ssh.Source @sshOptions $remoteHost $command
  if ($LASTEXITCODE -ne 0) {
    throw "Could not list completed backups in $RemoteDirectory (ssh exit $LASTEXITCODE)."
  }
  return @($result | Where-Object { $_ -and $_.EndsWith('.complete') })
}

function Copy-VerifiedBackup {
  param(
    [Parameter(Mandatory = $true)][string]$RemoteDirectory,
    [Parameter(Mandatory = $true)][string]$FileName
  )

  if ($FileName -notmatch '^(celizdb-\d{8}T\d{6}Z\.dump|celiz-uploads-\d{8}T\d{6}Z\.tar\.gz)$') {
    throw "Unexpected server backup filename: $FileName"
  }

  $remoteFile = "$RemoteDirectory/$FileName"
  $remoteChecksum = "$remoteFile.sha256"
  $localFile = Join-Path $LocalDirectory $FileName
  $localChecksum = "$localFile.sha256"
  $localComplete = "$localFile.complete"
  $partialFile = "$localFile.partial"
  $partialChecksum = "$localChecksum.partial"

  if ((Test-Path -LiteralPath $localComplete -PathType Leaf) -and
      (Test-Path -LiteralPath $localFile -PathType Leaf) -and
      (Test-Path -LiteralPath $localChecksum -PathType Leaf)) {
    $existingLine = Get-Content -LiteralPath $localChecksum -Raw
    if ($existingLine -match '^(?<hash>[A-Fa-f0-9]{64})\s+[* ]?(?<name>[^\r\n]+)\s*$' -and
        $Matches.name -eq $FileName -and
        (Get-FileHash -LiteralPath $localFile -Algorithm SHA256).Hash -eq $Matches.hash) {
      Write-Output "Already verified: $localFile"
      return
    }
  }

  Remove-Item -LiteralPath $localComplete -Force -ErrorAction SilentlyContinue
  $remoteChecksumPath = "${remoteHost}:$remoteChecksum"
  $remoteFilePath = "${remoteHost}:$remoteFile"
  & $scp.Source @sshOptions $remoteChecksumPath $partialChecksum
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $partialChecksum -Force -ErrorAction SilentlyContinue
    throw "Could not download checksum for $FileName (scp exit $LASTEXITCODE)."
  }
  & $scp.Source @sshOptions $remoteFilePath $partialFile
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $partialFile, $partialChecksum -Force -ErrorAction SilentlyContinue
    throw "Could not download $FileName (scp exit $LASTEXITCODE)."
  }

  try {
    $checksumLine = Get-Content -LiteralPath $partialChecksum -Raw
    if ($checksumLine -notmatch '^(?<hash>[A-Fa-f0-9]{64})\s+[* ]?(?<name>[^\r\n]+)\s*$' -or
        $Matches.name -ne $FileName) {
      throw "Invalid checksum manifest for $FileName."
    }

    $actualHash = (Get-FileHash -LiteralPath $partialFile -Algorithm SHA256).Hash
    if ($actualHash -ne $Matches.hash) {
      throw "SHA-256 verification failed for $FileName."
    }

    Remove-Item -LiteralPath $localComplete -Force -ErrorAction SilentlyContinue
    Move-Item -LiteralPath $partialFile -Destination $localFile -Force
    Move-Item -LiteralPath $partialChecksum -Destination $localChecksum -Force
    [System.IO.File]::WriteAllText("$localComplete.partial", "verified`n")
    Move-Item -LiteralPath "$localComplete.partial" -Destination $localComplete -Force
    Write-Output "Verified and saved $localFile"
  }
  catch {
    Remove-Item -LiteralPath $partialFile, $partialChecksum -Force -ErrorAction SilentlyContinue
    throw
  }
}

$backupSets = @(
  @{
    Directory = '/srv/celiz/backups/database'
    Pattern   = 'celizdb-*.dump'
  },
  @{
    Directory = '/srv/celiz/backups/uploads'
    Pattern   = 'celiz-uploads-*.tar.gz'
  }
)

foreach ($backupSet in $backupSets) {
  foreach ($marker in Get-RemoteCompletedFiles -RemoteDirectory $backupSet.Directory -Pattern $backupSet.Pattern) {
    $fileName = $marker.Substring(0, $marker.Length - '.complete'.Length)
    Copy-VerifiedBackup -RemoteDirectory $backupSet.Directory -FileName $fileName
  }
}

$retentionCutoff = (Get-Date).AddDays(-$LocalRetentionDays)
Get-ChildItem -LiteralPath $LocalDirectory -File -Filter '*.complete' |
  Where-Object { $_.LastWriteTime -lt $retentionCutoff } |
  ForEach-Object {
    $backupPath = $_.FullName.Substring(0, $_.FullName.Length - '.complete'.Length)
    if ($backupPath -match '[\\/](celizdb-\d{8}T\d{6}Z\.dump|celiz-uploads-\d{8}T\d{6}Z\.tar\.gz)$') {
      Remove-Item -LiteralPath $_.FullName, $backupPath, "$backupPath.sha256" -Force -ErrorAction SilentlyContinue
    }
  }
