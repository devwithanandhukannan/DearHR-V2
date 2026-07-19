// scripts/seed.ts — Run with: npm run seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@dearhr.com';
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'DearHR@Admin2026';

  console.log('🌱 Seeding DearHR database...');

  // ─── Seed default Platform Admin ─────────────────────────────────────────
  const existing = await (prisma as any).user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`✅ Admin already exists: ${ADMIN_EMAIL} — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await (prisma as any).user.create({
      data: {
        email:       ADMIN_EMAIL,
        password:    passwordHash,
        globalRoles: 2, // PLATFORM_ADMIN
        isVerified:  true,
      },
    });
    console.log(`✅ Admin created: ${admin.email}  |  Role: PLATFORM_ADMIN (2)`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('   ⚠️  Change this password after first login!');
  }

  // ─── Seed default PlatformConfig placeholders ─────────────────────────────
  const configs = [
    { key: 'groq_api_key',  value: '', isSecret: true  },
    { key: 'smtp_host',     value: 'smtp.gmail.com', isSecret: false },
    { key: 'smtp_port',     value: '587', isSecret: false },
    { key: 'smtp_user',     value: '', isSecret: false },
    { key: 'smtp_pass',     value: '', isSecret: true  },
    { key: 'platform_name', value: 'DearHR', isSecret: false },
  ];

  for (const cfg of configs) {
    await (prisma as any).platformConfig.upsert({
      where:  { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log('✅ Platform config keys seeded.');

  console.log('\n🚀 Seed complete! Login at /admin/login');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
