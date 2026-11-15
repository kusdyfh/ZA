// Minimal bootstrap for a brand-new production/preview database: the
// fixed RBAC catalog (roles, permissions) plus the one Store row every
// StoreContext lookup depends on (docs/v2/adr/0006). Deliberately does
// NOT run the rest of seed.ts's demo catalog/inventory/shipping/orders/
// CMS data — those are fixtures for local development, not something a
// real deployment should ever get seeded with.
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

    const roleRecord = await prisma.role.findUniqueOrThrow({
      where: { key: role.key },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: roleRecord.id,
        permissionId: { notIn: permissions.map((permission) => permission.id) },
      },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRecord.id,
            permissionId: permission.id,
          },
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

/** The one Store row per docs/v2/adr/0006. Keyed by domain so re-running this script is a no-op. */
async function seedStore(): Promise<void> {
  await prisma.store.upsert({
    where: { domain: 'za-store.local' },
    update: {},
    create: {
      name: 'ZA Store',
      domain: 'za-store.local',
      defaultLocale: 'en',
      defaultCurrency: 'IQD',
    },
  });
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedBootstrapSuperAdmin();
  await seedStore();
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
