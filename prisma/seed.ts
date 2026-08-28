import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Celiz LK database...');

  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    const existingUsers = await prisma.user.count();
    const existingProducts = await prisma.product.count();
    if (existingUsers > 0 || existingProducts > 0) {
      throw new Error('Refusing to delete existing data. Set ALLOW_DESTRUCTIVE_SEED=true only for an intentional local reset.');
    }
  }

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminRefreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.adminUser.create({
    data: {
      email: 'admin@celizlk.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      name: 'Celiz LK Administrator',
      role: 'SUPER_ADMIN',
    },
  });

  // Create Admin & Test User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@celizlk.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      fullName: 'Celiz LK Admin',
      phone: '+94 77 123 4567',
      role: 'ADMIN',
      profile: {
        create: {
          addressLine1: 'No. 45 Galle Road',
          city: 'Colombo 03',
          district: 'Colombo',
          postalCode: '00300',
        },
      },
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'customer@celizlk.com',
      passwordHash: await bcrypt.hash('user123', 12),
      fullName: 'Kavindu Perera',
      phone: '+94 71 987 6543',
      role: 'CUSTOMER',
      profile: {
        create: {
          addressLine1: '12/A Kandy Road',
          city: 'Kadawatha',
          district: 'Gampaha',
          postalCode: '11850',
        },
      },
    },
  });

  // Create Categories
  const earbudsCat = await prisma.category.create({
    data: {
      name: 'Wireless Earbuds',
      slug: 'earbuds',
      description: 'True wireless earbuds with ANC, deep bass, and crystal-clear voice clarity.',
      seoTitle: 'Buy Premium Wireless Earbuds in Sri Lanka | Celiz LK',
      seoDescription: 'Explore noise-canceling wireless earbuds, TWS earphones, and Bluetooth headsets with islandwide delivery in Sri Lanka.',
    },
  });

  const chargersCat = await prisma.category.create({
    data: {
      name: 'Fast Chargers & Cables',
      slug: 'chargers',
      description: 'GaN fast wall chargers, braided Type-C & Lightning cables for iPhone and Android.',
      seoTitle: 'Fast Chargers & USB-C Cables Sri Lanka | Celiz LK',
      seoDescription: 'High-speed PD fast chargers, MagSafe wireless chargers, and heavy-duty cables.',
    },
  });

  const powerBanksCat = await prisma.category.create({
    data: {
      name: 'Power Banks',
      slug: 'power-banks',
      description: 'High capacity portable power banks with fast charging and multi-device support.',
      seoTitle: 'Portable Power Banks Sri Lanka | Celiz LK',
      seoDescription: '10000mAh, 20000mAh, and 30000mAh fast-charging power banks for phones and laptops.',
    },
  });

  const smartwatchesCat = await prisma.category.create({
    data: {
      name: 'Smartwatches',
      slug: 'smartwatches',
      description: 'Fitness trackers, AMOLED display smartwatches, and bluetooth calling wearables.',
      seoTitle: 'Smartwatches & Fitness Trackers Sri Lanka | Celiz LK',
      seoDescription: 'Shop stylish smartwatches with heart rate tracking, SPO2 monitoring, and long battery life.',
    },
  });

  const accessoriesCat = await prisma.category.create({
    data: {
      name: 'Tech Accessories',
      slug: 'accessories',
      description: 'Phone stands, car mounts, cleaning kits, and essential gadget accessories.',
      seoTitle: 'Tech Gadget Accessories | Celiz LK',
      seoDescription: 'Premium mobile and desktop accessories in Sri Lanka.',
    },
  });

  // Category Attributes (For Future Comparison Engine)
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: earbudsCat.id, attributeKey: 'battery_life_hrs', attributeLabel: 'Battery Life', dataType: 'number', unit: 'hours', isComparable: true },
      { categoryId: earbudsCat.id, attributeKey: 'bluetooth_ver', attributeLabel: 'Bluetooth Version', dataType: 'text', isComparable: true },
      { categoryId: earbudsCat.id, attributeKey: 'anc_support', attributeLabel: 'Active Noise Cancellation', dataType: 'boolean', isComparable: true },
      { categoryId: earbudsCat.id, attributeKey: 'water_rating', attributeLabel: 'Water Resistance', dataType: 'text', isComparable: true },
      { categoryId: chargersCat.id, attributeKey: 'max_wattage', attributeLabel: 'Max Output Wattage', dataType: 'number', unit: 'W', isComparable: true },
      { categoryId: chargersCat.id, attributeKey: 'port_count', attributeLabel: 'Number of Ports', dataType: 'number', isComparable: true },
      { categoryId: powerBanksCat.id, attributeKey: 'capacity_mah', attributeLabel: 'Capacity', dataType: 'number', unit: 'mAh', isComparable: true },
      { categoryId: powerBanksCat.id, attributeKey: 'fast_charging_protocol', attributeLabel: 'Fast Charge Support', dataType: 'text', isComparable: true },
    ],
  });

  // Sample Products
  const products = [
    {
      name: 'Celiz SoundPulse Pro ANC Earbuds',
      slug: 'celiz-soundpulse-pro-anc-earbuds',
      description: 'Experience studio-quality acoustics with Active Noise Cancellation (ANC) up to 35dB. Features transparency mode, quad-mic ENC for crystal clear calls, and total 32 hours battery life with wireless charging case.',
      price: 14500,
      discountPrice: 11990,
      stockQty: 25,
      categoryId: earbudsCat.id,
      brand: 'Celiz LK',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        battery_life_hrs: '32',
        bluetooth_ver: 'v5.3',
        anc_support: true,
        water_rating: 'IPX5 Water Resistant',
        charging_type: 'USB-C + Qi Wireless',
      }),
      seoTitle: 'Celiz SoundPulse Pro ANC Wireless Earbuds',
      seoDescription: 'Buy Celiz SoundPulse Pro ANC Earbuds in Sri Lanka. 35dB noise cancellation, 32-hr battery life, IPX5.',
      isFeatured: true,
    },
    {
      name: 'Anker Soundcore Life P2 Mini TWS',
      slug: 'anker-soundcore-life-p2-mini-tws',
      description: 'Ultra-lightweight wireless earbuds with 10mm oversized drivers producing big bass acoustics. 3 EQ modes (Soundcore Signature, Bass Booster, Podcast) and 32-hour playback time.',
      price: 12900,
      discountPrice: 9990,
      stockQty: 18,
      categoryId: earbudsCat.id,
      brand: 'Anker',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        battery_life_hrs: '32',
        bluetooth_ver: 'v5.2',
        anc_support: false,
        water_rating: 'IPX5',
        driver_size: '10mm Dynamic',
      }),
      seoTitle: 'Anker Soundcore Life P2 Mini Price Sri Lanka',
      seoDescription: 'Buy Anker Soundcore Life P2 Mini earbuds in Sri Lanka. Lightweight TWS with 32h battery.',
      isFeatured: true,
    },
    {
      name: 'Celiz NitroCharge 65W GaN Dual USB-C Fast Charger',
      slug: 'celiz-nitrocharge-65w-gan-fast-charger',
      description: 'Powered by advanced Gallium Nitride (GaN) technology. Charge your MacBook Pro, iPhone, and Android flagship simultaneously at top speed. Intelligent power distribution protects battery health.',
      price: 8900,
      discountPrice: 7490,
      stockQty: 30,
      categoryId: chargersCat.id,
      brand: 'Celiz LK',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        max_wattage: '65',
        port_count: '3 (2x USB-C PD, 1x USB-A QC3.0)',
        technology: 'GaN III Tech',
        compatibility: 'MacBook, iPhone 15/14, Samsung Galaxy S24, iPad',
      }),
      seoTitle: 'Celiz NitroCharge 65W GaN Charger Sri Lanka',
      seoDescription: 'Ultra-compact 65W GaN fast charger for laptops and smartphones in Sri Lanka.',
      isFeatured: true,
    },
    {
      name: 'Baseus 20000mAh 22.5W Fast Charging Power Bank',
      slug: 'baseus-20000mah-22-5w-fast-charging-power-bank',
      description: 'High capacity 20000mAh battery pack with digital LED display showing exact battery percentage. Supports PD 3.0, QC 3.0, and SCP fast charging for Huawei, Xiaomi, Apple, and Samsung.',
      price: 11500,
      discountPrice: 8990,
      stockQty: 15,
      categoryId: powerBanksCat.id,
      brand: 'Baseus',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        capacity_mah: '20000',
        fast_charging_protocol: 'PD 3.0 (20W) / QC 3.0 (22.5W)',
        output_ports: '2x USB-A, 1x USB-C',
        display: 'Digital LED Percentage Display',
      }),
      seoTitle: 'Baseus 20000mAh Power Bank Price Sri Lanka',
      seoDescription: 'Buy Baseus 20000mAh 22.5W Power Bank with digital LED display at best price in Sri Lanka.',
      isFeatured: true,
    },
    {
      name: 'Celiz Vector Horizon AMOLED Smartwatch',
      slug: 'celiz-vector-horizon-amoled-smartwatch',
      description: 'Vibrant 1.43-inch HD AMOLED Always-On Display with 466x466 resolution. Bluetooth calling, 100+ sports modes, 24/7 Heart Rate & SpO2 blood oxygen sensor, IP68 water rating, and 10-day battery life.',
      price: 18900,
      discountPrice: 14990,
      stockQty: 20,
      categoryId: smartwatchesCat.id,
      brand: 'Celiz LK',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        display_size: '1.43-inch AMOLED (466x466)',
        calling_feature: 'Bluetooth Phone Calling & Mic',
        battery_life_days: '10 Days Normal Use',
        water_resistance: 'IP68 Dust & Water Proof',
        sensors: 'Heart Rate, SpO2, Sleep, Step Counter',
      }),
      seoTitle: 'Celiz Vector Horizon AMOLED Smartwatch Sri Lanka',
      seoDescription: 'Shop Celiz Horizon AMOLED Smartwatch with Bluetooth calling & SpO2 monitoring in LK.',
      isFeatured: true,
    },
    {
      name: 'Celiz ArmorBraid 100W PD Type-C to Type-C Cable (1.5m)',
      slug: 'celiz-armorbraid-100w-type-c-cable',
      description: 'Heavy duty nylon braided 100W Power Delivery cable with E-Marker smart chip. Supports ultra-fast charging for laptops and high-speed 480Mbps data transfer.',
      price: 3500,
      discountPrice: 2490,
      stockQty: 40,
      categoryId: chargersCat.id,
      brand: 'Celiz LK',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      ]),
      specs: JSON.stringify({
        max_wattage: '100W PD',
        length: '1.5 Meters',
        material: 'Military-Grade Braided Nylon',
        data_speed: '480 Mbps',
      }),
      seoTitle: 'Celiz 100W PD Type-C Cable Sri Lanka',
      seoDescription: 'Durable 100W Type-C fast charging cable for laptops and smartphones.',
      isFeatured: false,
    },
  ];

  const brandIds = new Map<string, string>();
  const reelBrands = [
    ['JBL', 'jbl', '/images/brands/jbl.png', 1],
    ['Anker', 'anker', '/images/brands/anker.png', 2],
    ['Apple', 'apple', '/images/brands/apple.png', 3],
    ['Samsung', 'samsung', '/images/brands/samsung.png', 4],
    ['DJI', 'dji', '/images/brands/dji.png', 5],
    ['MI', 'mi', '/images/brands/mi.png', 6],
    ['Baseus', 'baseus', '/images/brands/baseus.png', 7],
    ['UGREEN', 'ugreen', '/images/brands/ugreen.png', 8],
    ['huawei', 'huawei', '/images/brands/huawei.png', 9],
    ['insta', 'insta', '/images/brands/insta.png', 10],
  ] as const;
  for (const [name, slug, logoUrl, sortOrder] of reelBrands) {
    const brand = await prisma.brand.create({ data: { name, slug, logoUrl, sortOrder } });
    brandIds.set(name, brand.id);
  }
  for (const prod of products) {
    const { brand, ...productData } = prod;
    let brandId = brandIds.get(brand);
    if (!brandId) {
      const record = await prisma.brand.upsert({
        where: { slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
        update: { name: brand, isActive: true },
        create: { name: brand, slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
      });
      brandId = record.id;
      brandIds.set(brand, brandId);
    }
    await prisma.product.create({
      data: { ...productData, brandId },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
