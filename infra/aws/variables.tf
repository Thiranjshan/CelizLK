variable "aws_region" {
  description = "AWS region for the EC2 deployment."
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type; review regional pricing and application capacity before provisioning."
  type        = string
  default     = "t3.medium"
}

variable "root_volume_size_gib" {
  description = "Encrypted root disk size in GiB. This disk is replaced with the EC2 instance."
  type        = number
  default     = 30
}

variable "data_volume_size_gib" {
  description = "Encrypted persistent disk size in GiB for PostgreSQL, uploads, Caddy state, and backups."
  type        = number
  default     = 100
}

variable "ssh_ingress_cidr" {
  description = "Administrator IPv4 CIDR allowed to SSH, for example 203.0.113.8/32. Empty disables inbound SSH."
  type        = string
  default     = ""

  validation {
    condition     = (var.ssh_ingress_cidr == "") == (var.ssh_public_key == "")
    error_message = "Set both ssh_ingress_cidr and ssh_public_key to enable SSH, or leave both empty."
  }

  validation {
    condition     = var.ssh_ingress_cidr == "" || (can(cidrhost(var.ssh_ingress_cidr, 0)) && !strcontains(var.ssh_ingress_cidr, ":"))
    error_message = "ssh_ingress_cidr must be empty or a valid IPv4 CIDR."
  }
}

variable "ssh_public_key" {
  description = "Administrator SSH public key. Leave empty to disable SSH key provisioning."
  type        = string
  default     = ""
}

variable "backup_retention_days" {
  description = "Number of days to retain completed on-instance database and upload backups."
  type        = number
  default     = 14

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 3650
    error_message = "backup_retention_days must be between 1 and 3650."
  }
}

variable "github_repository" {
  description = "GitHub owner/repository permitted to request production deployments through OIDC."
  type        = string
  default     = "Thiranjshan/CelizLK"

  validation {
    condition     = length(split("/", var.github_repository)) == 2
    error_message = "github_repository must be in owner/repository format."
  }
}

variable "github_deploy_role_name" {
  description = "Name of the pre-provisioned GitHub Actions IAM role allowed to invoke this EC2 instance through SSM."
  type        = string
}
