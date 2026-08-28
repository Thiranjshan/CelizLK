INSERT INTO "Brand" ("id", "name", "slug", "logoUrl", "isActive", "sortOrder", "updatedAt") VALUES
  (lower(hex(randomblob(16))), 'JBL', 'jbl', '/images/brands/jbl.png', true, 1, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'Anker', 'anker', '/images/brands/anker.png', true, 2, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'Apple', 'apple', '/images/brands/apple.png', true, 3, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'Samsung', 'samsung', '/images/brands/samsung.png', true, 4, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'DJI', 'dji', '/images/brands/dji.png', true, 5, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'MI', 'mi', '/images/brands/mi.png', true, 6, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'Baseus', 'baseus', '/images/brands/baseus.png', true, 7, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'UGREEN', 'ugreen', '/images/brands/ugreen.png', true, 8, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'huawei', 'huawei', '/images/brands/huawei.png', true, 9, CURRENT_TIMESTAMP),
  (lower(hex(randomblob(16))), 'insta', 'insta', '/images/brands/insta.png', true, 10, CURRENT_TIMESTAMP)
ON CONFLICT("slug") DO UPDATE SET
  "logoUrl" = excluded."logoUrl",
  "sortOrder" = excluded."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;