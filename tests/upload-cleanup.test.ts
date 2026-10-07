import assert from 'node:assert/strict';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { deleteUploadFileIfExists, getRemovedUploadUrls } from '@/lib/upload-storage';

test('removes replaced or cleared upload files and ignores unchanged URLs', async () => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const oldFile = path.join(uploadsDir, 'old-logo.png');
  const newFile = path.join(uploadsDir, 'new-logo.png');
  const unchangedFile = path.join(uploadsDir, 'unchanged.png');

  await writeFile(oldFile, 'old');
  await writeFile(newFile, 'new');
  await writeFile(unchangedFile, 'same');

  const oldUrl = '/uploads/old-logo.png';
  const newUrl = '/uploads/new-logo.png';
  const unchangedUrl = '/uploads/unchanged.png';

  const removed = getRemovedUploadUrls([oldUrl, unchangedUrl], [newUrl, unchangedUrl]);
  assert.deepEqual(removed, [oldUrl]);

  await deleteUploadFileIfExists(oldUrl);
  const existsAfterDelete = await stat(oldFile).then(() => true).catch(() => false);
  assert.equal(existsAfterDelete, false);

  await deleteUploadFileIfExists('/uploads/missing.png');
  assert.equal(await stat(path.join(uploadsDir, 'new-logo.png')).then(() => true).catch(() => false), true);
});
