// Seeds the fixed RBAC catalog (roles, permissions, grants) plus one
// bootstrap Super Admin account. Idempotent — safe to re-run.
// Source of truth: src/modules/identity/domain/constants/*.
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  PERMISSION_DEFINITIONS,
  ROLE_DEFINITIONS,
} from '../src/modules/identity/domain/constants/permissions.constants';

const prisma = new PrismaClient();

async function seedPermissions(): Promise<void> {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: {
        key: permission.key,
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
    });
  }
}

async function seedRoles(): Promise<void> {
  for (const role of Object.values(ROLE_DEFINITIONS)) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: role.permissions } },
      select: { id: true },
    });

    const roleRecord = await prisma.role.findUniqueOrThrow({ where: { key: role.key } });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: roleRecord.id,
        permissionId: { notIn: permissions.map((permission) => permission.id) },
      },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleRecord.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: roleRecord.id, permissionId: permission.id },
      });
    }
  }
}

async function seedBootstrapSuperAdmin(): Promise<void> {
  const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      'Skipping bootstrap Super Admin: BOOTSTRAP_SUPER_ADMIN_EMAIL / BOOTSTRAP_SUPER_ADMIN_PASSWORD not set.',
    );
    return;
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { key: ROLE_DEFINITIONS.SUPER_ADMIN.key },
  });

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
      roleId: superAdminRole.id,
      createdByActorType: 'SYSTEM',
      updatedByActorType: 'SYSTEM',
    },
  });
}

/** The one Store row per docs/v2/adr/0006 — keyed by domain so re-seeding is idempotent. */
async function seedStore(): Promise<string> {
  const store = await prisma.store.upsert({
    where: { domain: 'za-store.local' },
    update: {},
    create: {
      name: 'ZA Store',
      domain: 'za-store.local',
      defaultLocale: 'en',
      defaultCurrency: 'IQD',
    },
  });
  return store.id;
}

/**
 * Illustrative local-dev catalog data — not real merchandise. Exercises
 * the 3-level category tree, brand/tag scoping, and a DRAFT + two ACTIVE
 * products so status/visibility are visible from a fresh seed.
 */
async function seedCatalog(storeId: string): Promise<void> {
  const scrubs = await prisma.category.upsert({
    where: { storeId_slug: { storeId, slug: 'scrubs' } },
    update: {},
    create: { storeId, name: 'Scrubs', slug: 'scrubs', sortOrder: 0 },
  });
  const labCoats = await prisma.category.upsert({
    where: { storeId_slug: { storeId, slug: 'lab-coats' } },
    update: {},
    create: { storeId, name: 'Lab Coats', slug: 'lab-coats', sortOrder: 1 },
  });
  const tops = await prisma.category.upsert({
    where: { storeId_slug: { storeId, slug: 'tops' } },
    update: {},
    create: { storeId, name: 'Tops', slug: 'tops', parentId: scrubs.id, sortOrder: 0 },
  });
  const bottoms = await prisma.category.upsert({
    where: { storeId_slug: { storeId, slug: 'bottoms' } },
    update: {},
    create: { storeId, name: 'Bottoms', slug: 'bottoms', parentId: scrubs.id, sortOrder: 1 },
  });
  const shortSleeve = await prisma.category.upsert({
    where: { storeId_slug: { storeId, slug: 'short-sleeve' } },
    update: {},
    create: { storeId, name: 'Short Sleeve', slug: 'short-sleeve', parentId: tops.id, sortOrder: 0 },
  });

  const zaOriginals = await prisma.brand.upsert({
    where: { storeId_slug: { storeId, slug: 'za-originals' } },
    update: {},
    create: { storeId, name: 'ZA Originals', slug: 'za-originals' },
  });
  const comfortFit = await prisma.brand.upsert({
    where: { storeId_slug: { storeId, slug: 'comfort-fit' } },
    update: {},
    create: { storeId, name: 'ComfortFit', slug: 'comfort-fit' },
  });

  const newTag = await prisma.tag.upsert({
    where: { storeId_slug: { storeId, slug: 'new' } },
    update: {},
    create: { storeId, name: 'New', slug: 'new' },
  });
  const bestsellerTag = await prisma.tag.upsert({
    where: { storeId_slug: { storeId, slug: 'bestseller' } },
    update: {},
    create: { storeId, name: 'Bestseller', slug: 'bestseller' },
  });
  await prisma.tag.upsert({
    where: { storeId_slug: { storeId, slug: 'limited-edition' } },
    update: {},
    create: { storeId, name: 'Limited Edition', slug: 'limited-edition' },
  });

  const vNeckTop = await prisma.product.upsert({
    where: { storeId_slug: { storeId, slug: 'classic-v-neck-scrub-top' } },
    update: {},
    create: {
      storeId,
      name: 'Classic V-Neck Scrub Top',
      slug: 'classic-v-neck-scrub-top',
      sku: 'ZA-TOP-VNECK-001',
      shortDescription: 'A breathable, tailored V-neck scrub top.',
      status: 'ACTIVE',
      price: '45000.00',
      discountPrice: '39000.00',
      currencyCode: 'IQD',
      categoryId: shortSleeve.id,
      brandId: zaOriginals.id,
      isFeatured: true,
      metaTitle: 'Classic V-Neck Scrub Top',
    },
  });

  const scrubPants = await prisma.product.upsert({
    where: { storeId_slug: { storeId, slug: 'relaxed-fit-scrub-pants' } },
    update: {},
    create: {
      storeId,
      name: 'Relaxed Fit Scrub Pants',
      slug: 'relaxed-fit-scrub-pants',
      sku: 'ZA-PANT-RELAX-001',
      shortDescription: 'Relaxed fit scrub pants with a comfortable waistband.',
      status: 'ACTIVE',
      price: '42000.00',
      currencyCode: 'IQD',
      categoryId: bottoms.id,
      brandId: comfortFit.id,
      isBestSeller: true,
      metaTitle: 'Relaxed Fit Scrub Pants',
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId, slug: 'premium-lab-coat' } },
    update: {},
    create: {
      storeId,
      name: 'Premium Lab Coat',
      slug: 'premium-lab-coat',
      sku: 'ZA-COAT-PREM-001',
      shortDescription: 'A tailored, premium lab coat.',
      status: 'DRAFT',
      price: '65000.00',
      currencyCode: 'IQD',
      categoryId: labCoats.id,
      brandId: zaOriginals.id,
      metaTitle: 'Premium Lab Coat',
    },
  });

  await prisma.productTag.upsert({
    where: { productId_tagId: { productId: vNeckTop.id, tagId: newTag.id } },
    update: {},
    create: { productId: vNeckTop.id, tagId: newTag.id },
  });
  await prisma.productTag.upsert({
    where: { productId_tagId: { productId: scrubPants.id, tagId: bestsellerTag.id } },
    update: {},
    create: { productId: scrubPants.id, tagId: bestsellerTag.id },
  });
}

/**
 * Epic 3B (Product Experience & Merchandising) additions to the same
 * illustrative catalog — colors, sizes, variants, media, specifications,
 * highlights/rich content, and cross-sell/related relations. Gives the
 * two Epic 3A ACTIVE products a real variant + cover image each, so the
 * seeded data actually satisfies ProductPolicy.assertReadyForActive()
 * rather than only being Active because this script writes directly via
 * Prisma (which bypasses the use-case gate).
 */
async function seedProductExperience(storeId: string): Promise<void> {
  const navyBlue = await prisma.color.upsert({
    where: { storeId_name: { storeId, name: 'Navy Blue' } },
    update: {},
    create: { storeId, name: 'Navy Blue', hexCode: '#1B2A4A' },
  });
  const ceilBlue = await prisma.color.upsert({
    where: { storeId_name: { storeId, name: 'Ceil Blue' } },
    update: {},
    create: { storeId, name: 'Ceil Blue', hexCode: '#6699CC' },
  });
  const black = await prisma.color.upsert({
    where: { storeId_name: { storeId, name: 'Black' } },
    update: {},
    create: { storeId, name: 'Black', hexCode: '#000000' },
  });

  const sizeLabels: [string, number][] = [
    ['XS', 0],
    ['S', 1],
    ['M', 2],
    ['L', 3],
    ['XL', 4],
  ];
  const sizes = new Map<string, string>();
  for (const [label, sortOrder] of sizeLabels) {
    const size = await prisma.size.upsert({
      where: { storeId_label: { storeId, label } },
      update: {},
      create: { storeId, label, sortOrder },
    });
    sizes.set(label, size.id);
  }

  const vNeckTop = await prisma.product.findUniqueOrThrow({
    where: { storeId_slug: { storeId, slug: 'classic-v-neck-scrub-top' } },
  });
  const scrubPants = await prisma.product.findUniqueOrThrow({
    where: { storeId_slug: { storeId, slug: 'relaxed-fit-scrub-pants' } },
  });
  const labCoat = await prisma.product.findUniqueOrThrow({
    where: { storeId_slug: { storeId, slug: 'premium-lab-coat' } },
  });

  await prisma.productVariant.upsert({
    where: { storeId_sku: { storeId, sku: 'ZA-TOP-VNECK-001-NVY-M' } },
    update: {},
    create: {
      storeId,
      productId: vNeckTop.id,
      sku: 'ZA-TOP-VNECK-001-NVY-M',
      colorId: navyBlue.id,
      sizeId: sizes.get('M'),
    },
  });
  await prisma.productVariant.upsert({
    where: { storeId_sku: { storeId, sku: 'ZA-TOP-VNECK-001-CEI-L' } },
    update: {},
    create: {
      storeId,
      productId: vNeckTop.id,
      sku: 'ZA-TOP-VNECK-001-CEI-L',
      colorId: ceilBlue.id,
      sizeId: sizes.get('L'),
    },
  });
  await prisma.productVariant.upsert({
    where: { storeId_sku: { storeId, sku: 'ZA-PANT-RELAX-001-BLK-M' } },
    update: {},
    create: {
      storeId,
      productId: scrubPants.id,
      sku: 'ZA-PANT-RELAX-001-BLK-M',
      colorId: black.id,
      sizeId: sizes.get('M'),
    },
  });
  await prisma.productVariant.upsert({
    where: { storeId_sku: { storeId, sku: 'ZA-COAT-PREM-001-STD' } },
    update: {},
    create: { storeId, productId: labCoat.id, sku: 'ZA-COAT-PREM-001-STD' },
  });

  await prisma.productMedia.deleteMany({ where: { productId: { in: [vNeckTop.id, scrubPants.id] } } });
  await prisma.productMedia.createMany({
    data: [
      {
        productId: vNeckTop.id,
        type: 'IMAGE',
        url: 'https://images.za-store.local/products/classic-v-neck-scrub-top/cover.jpg',
        altText: 'Classic V-Neck Scrub Top in Navy Blue, front view.',
        isCover: true,
        sortOrder: 0,
      },
      {
        productId: vNeckTop.id,
        type: 'IMAGE',
        url: 'https://images.za-store.local/products/classic-v-neck-scrub-top/back.jpg',
        altText: 'Classic V-Neck Scrub Top in Navy Blue, back view.',
        isCover: false,
        sortOrder: 1,
      },
      {
        productId: scrubPants.id,
        type: 'IMAGE',
        url: 'https://images.za-store.local/products/relaxed-fit-scrub-pants/cover.jpg',
        altText: 'Relaxed Fit Scrub Pants in Black, front view.',
        isCover: true,
        sortOrder: 0,
      },
    ],
  });

  await prisma.productSpecification.deleteMany({ where: { productId: vNeckTop.id } });
  await prisma.productSpecification.createMany({
    data: [
      { productId: vNeckTop.id, label: 'Material', value: '65% Polyester, 35% Cotton', sortOrder: 0 },
      { productId: vNeckTop.id, label: 'Care', value: 'Machine wash cold, tumble dry low.', sortOrder: 1 },
    ],
  });

  await prisma.product.update({
    where: { id: vNeckTop.id },
    data: {
      highlights: ['Moisture-wicking fabric', '4-way stretch', 'Reinforced seams'],
      richContent: '<p>Designed for long shifts — breathable, tailored, and built to move with you.</p>',
    },
  });

  await prisma.productRelation.deleteMany({
    where: {
      OR: [
        { productId: vNeckTop.id, type: 'CROSS_SELL' },
        { productId: scrubPants.id, type: 'CROSS_SELL' },
      ],
    },
  });
  await prisma.productRelation.createMany({
    data: [
      { productId: vNeckTop.id, relatedProductId: scrubPants.id, type: 'CROSS_SELL', sortOrder: 0 },
      { productId: scrubPants.id, relatedProductId: vNeckTop.id, type: 'CROSS_SELL', sortOrder: 0 },
    ],
  });
}

/**
 * Epic 4 (Inventory & Stock Management) additions — the one seeded
 * Warehouse (per docs/v2/adr/0014) plus starting stock for the four
 * variants seeded in Epic 3B. Every non-zero stock level is created
 * alongside its own RECEIVE StockMovement, never by setting
 * VariantStock.quantity directly — the same audit-trail rule
 * (docs/product/06-INVENTORY.md) the application code enforces applies
 * to this seed script too.
 */
async function seedInventory(storeId: string): Promise<void> {
  const warehouse = await prisma.warehouse.upsert({
    where: { storeId_code: { storeId, code: 'MAIN' } },
    update: {},
    create: { storeId, name: 'Main Warehouse', code: 'MAIN', isDefault: true },
  });

  const variantSkus: [string, number][] = [
    ['ZA-TOP-VNECK-001-NVY-M', 25],
    ['ZA-TOP-VNECK-001-CEI-L', 8],
    ['ZA-PANT-RELAX-001-BLK-M', 30],
    ['ZA-COAT-PREM-001-STD', 12],
  ];

  for (const [sku, initialQuantity] of variantSkus) {
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { storeId_sku: { storeId, sku } },
    });

    const existing = await prisma.variantStock.findUnique({
      where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
    });
    if (existing) {
      continue;
    }

    await prisma.variantStock.create({
      data: {
        variantId: variant.id,
        warehouseId: warehouse.id,
        quantity: initialQuantity,
        lowStockThreshold: 10,
      },
    });
    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        warehouseId: warehouse.id,
        type: 'RECEIVE',
        quantity: initialQuantity,
        resultingStock: initialQuantity,
        note: 'Initial seed stock.',
        actorType: 'SYSTEM',
      },
    });
  }
}

/**
 * Epic 12 (ADR 0027) — one zone covering every governorate the seeded
 * demo order/checkout flows use ('Baghdad' throughout this file plus the
 * app-level integration tests), one flat-rate "Standard Delivery" method,
 * and the one rate connecting them. Without this, `QuoteShippingRateUseCase`
 * has nothing to resolve and every checkout attempt against a freshly
 * seeded store fails with `UnsupportedDeliveryRegionError`/
 * `ShippingRateNotFoundError`. Idempotent via each model's own unique key.
 */
async function seedShipping(storeId: string): Promise<string> {
  const zone = await prisma.shippingZone.upsert({
    where: { storeId_name: { storeId, name: 'Central Iraq' } },
    update: {},
    create: { storeId, name: 'Central Iraq', governorates: ['Baghdad'] },
  });

  const method = await prisma.shippingMethod.upsert({
    where: { storeId_name: { storeId, name: 'Standard Delivery' } },
    update: {},
    create: { storeId, name: 'Standard Delivery', minDays: 2, maxDays: 5 },
  });

  await prisma.shippingRate.upsert({
    where: { zoneId_methodId: { zoneId: zone.id, methodId: method.id } },
    update: {},
    create: { storeId, zoneId: zone.id, methodId: method.id, fee: '5000' },
  });

  return method.id;
}

/**
 * Epic 5 (Orders & Checkout Core) additions — one demo guest Cart (left
 * empty, matching post-checkout state) plus one already-placed, CONFIRMED
 * Cash-on-Delivery order against a seeded variant. Mirrors exactly what
 * `PlaceOrderUseCase` does — a StockReservation created straight into
 * CONFIRMED (skipping the ACTIVE step, since this is seed data
 * representing an already-completed historical order), a matching SALE
 * StockMovement decrementing real stock, and the Order/OrderItem/
 * OrderStatusHistory rows — expressed via raw Prisma calls, consistent
 * with how the rest of seed.ts bypasses use-cases (see Epic 4's
 * `seedInventory`). Idempotent: skipped entirely if the demo order
 * already exists.
 */
async function seedCheckoutAndOrders(storeId: string, shippingMethodId: string): Promise<void> {
  const demoCustomerEmail = 'demo.customer@za-store.local';

  const existingOrder = await prisma.order.findFirst({
    where: { storeId, customerEmailSnapshot: demoCustomerEmail },
  });
  if (existingOrder) {
    return;
  }

  const guestToken = 'seed-demo-guest-token';
  const cart = await prisma.cart.upsert({
    where: { guestToken },
    update: {},
    create: { storeId, guestToken },
  });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const warehouse = await prisma.warehouse.findFirstOrThrow({ where: { storeId, isDefault: true } });
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { storeId_sku: { storeId, sku: 'ZA-TOP-VNECK-001-NVY-M' } },
    include: { product: true },
  });

  const quantity = 2;
  const stock = await prisma.variantStock.findUniqueOrThrow({
    where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
  });
  const resultingStock = stock.quantity - quantity;
  if (resultingStock < 0) {
    throw new Error('Seed data inconsistency: not enough demo stock to place the seeded order.');
  }

  const reservation = await prisma.stockReservation.create({
    data: {
      variantId: variant.id,
      warehouseId: warehouse.id,
      cartId: cart.id,
      quantity,
      status: 'CONFIRMED',
      expiresAt: new Date(Date.now() + 10 * 60_000),
      confirmedAt: new Date(),
    },
  });

  await prisma.variantStock.update({ where: { id: stock.id }, data: { quantity: resultingStock } });
  await prisma.stockMovement.create({
    data: {
      variantId: variant.id,
      warehouseId: warehouse.id,
      type: 'SALE',
      quantity,
      resultingStock,
      note: 'Seed demo order.',
      actorType: 'SYSTEM',
    },
  });

  const rawUnitPrice = variant.priceOverride ?? variant.product.discountPrice ?? variant.product.price;
  const unitPrice = rawUnitPrice.toNumber();
  const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
  const shippingFee = 5000;
  const subtotal = lineTotal;
  const total = subtotal + shippingFee;
  const orderNumber = `ORD-DEMO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  await prisma.order.create({
    data: {
      storeId,
      orderNumber,
      status: 'CONFIRMED',
      customerNameSnapshot: 'Demo Customer',
      customerEmailSnapshot: demoCustomerEmail,
      customerPhoneSnapshot: '+9647700000000',
      shippingFullName: 'Demo Customer',
      shippingPhone: '+9647700000000',
      shippingLine1: '123 Al-Rasheed Street',
      shippingCity: 'Baghdad',
      shippingGovernorate: 'Baghdad',
      shippingCountry: 'Iraq',
      shippingMethodId,
      subtotal,
      discountTotal: 0,
      shippingFee,
      taxTotal: 0,
      total,
      currencyCode: 'IQD',
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            variantId: variant.id,
            stockReservationId: reservation.id,
            productNameSnapshot: variant.product.name,
            skuSnapshot: variant.sku,
            unitPrice,
            quantity,
            lineTotal,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: 'PENDING', note: 'Order placed.', actorType: 'SYSTEM' },
          { status: 'CONFIRMED', note: 'Payment confirmed (Cash on Delivery).', actorType: 'SYSTEM' },
        ],
      },
    },
  });
}

/**
 * Epic 11 (ADR 0025) — the five fixed CMS pages, seeded `PUBLISHED` so
 * the storefront has real content immediately rather than every fresh
 * environment 404ing until an admin manually publishes each one.
 */
async function seedCms(storeId: string): Promise<void> {
  const pages: Array<{
    slug: string;
    title: string;
    content: string;
    faqItems?: { question: string; answer: string }[];
  }> = [
    {
      slug: 'about',
      title: 'About ZA Store',
      content:
        'ZA Store makes scrubs, lab coats, and accessories for the students and professionals of the medical world — designed to feel soft, modern, and genuinely comfortable through a long shift.',
    },
    {
      slug: 'contact',
      title: 'Contact us',
      content: 'Have a question about an order, sizing, or anything else? Send us a message and we’ll get back to you.',
    },
    {
      slug: 'faq',
      title: 'Frequently asked questions',
      content: '',
      faqItems: [
        {
          question: 'How long does shipping take?',
          answer: 'Orders are dispatched within 1 business day and typically arrive within 2–5 business days depending on your location.',
        },
        {
          question: 'What is your return policy?',
          answer: 'You can return unworn items within 14 days of delivery for a refund or exchange.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'Cash on Delivery is available today. Card payment support is coming soon.',
        },
      ],
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content:
        'ZA Store collects only the information needed to process your order and improve your shopping experience: contact details, shipping address, and order history. We never sell your data to third parties.',
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      content:
        'By placing an order with ZA Store, you agree to provide accurate shipping and contact information. Cash on Delivery is the only payment method currently supported.',
    },
  ];

  for (const page of pages) {
    const record = await prisma.cmsPage.upsert({
      where: { storeId_slug: { storeId, slug: page.slug } },
      update: {},
      create: {
        storeId,
        slug: page.slug,
        title: page.title,
        content: page.content,
        faqItems: page.faqItems,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    void record;
  }
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedBootstrapSuperAdmin();

  const storeId = await seedStore();
  await seedCatalog(storeId);
  await seedProductExperience(storeId);
  await seedInventory(storeId);
  const shippingMethodId = await seedShipping(storeId);
  await seedCheckoutAndOrders(storeId, shippingMethodId);
  await seedCms(storeId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
