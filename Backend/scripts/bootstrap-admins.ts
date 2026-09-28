import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/auth.model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const bootstrapAdmins = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured before bootstrapping.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for admin bootstrap check...');

  // ==========================================
  // 1. SUPER_ADMIN Handling
  // ==========================================
  const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const superAdminPassword = (process.env.SUPER_ADMIN_PASSWORD ?? '').trim();
  const superAdminName = (process.env.SUPER_ADMIN_NAME ?? 'Super Administrator').trim();

  if (superAdminCount > 1) {
    console.warn(`[WARNING] Multiple SUPER_ADMIN accounts found (${superAdminCount}). Stopping automatic mutation to prevent accidental data modification. Please audit database manually.`);
  } else if (superAdminCount === 1) {
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    console.log(`[OK] Exactly 1 SUPER_ADMIN exists (${existingSuperAdmin?.email}). Preserving existing account.`);
  } else {
    // superAdminCount === 0
    if (!superAdminEmail || !superAdminPassword) {
      console.warn('[NOTICE] No SUPER_ADMIN exists, but SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not provided in environment. Skipping SUPER_ADMIN creation.');
    } else {
      const existingUser = await User.findOne({ email: superAdminEmail });
      if (existingUser) {
        existingUser.role = 'SUPER_ADMIN';
        existingUser.isActive = true;
        await existingUser.save();
        console.log(`[SUCCESS] Promoted existing account (${superAdminEmail}) to SUPER_ADMIN.`);
      } else {
        await User.create({
          name: superAdminName,
          email: superAdminEmail,
          password: superAdminPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        });
        console.log(`[SUCCESS] Created 1 new SUPER_ADMIN (${superAdminEmail}).`);
      }
    }
  }

  // ==========================================
  // 2. ADMIN Handling
  // ==========================================
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim();
  const adminName = (process.env.ADMIN_NAME ?? 'Administrator').trim();

  if (adminCount > 1) {
    console.warn(`[WARNING] Multiple ADMIN accounts found (${adminCount}). Stopping automatic mutation to prevent accidental data modification. Please audit database manually.`);
  } else if (adminCount === 1) {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    console.log(`[OK] Exactly 1 ADMIN exists (${existingAdmin?.email}). Preserving existing account.`);
  } else {
    // adminCount === 0
    if (!adminEmail || !adminPassword) {
      console.warn('[NOTICE] No ADMIN exists, but ADMIN_EMAIL or ADMIN_PASSWORD is not provided in environment. Skipping ADMIN creation.');
    } else {
      const existingUser = await User.findOne({ email: adminEmail });
      if (existingUser) {
        existingUser.role = 'ADMIN';
        existingUser.isActive = true;
        await existingUser.save();
        console.log(`[SUCCESS] Promoted existing account (${adminEmail}) to ADMIN.`);
      } else {
        await User.create({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'ADMIN',
          isActive: true
        });
        console.log(`[SUCCESS] Created 1 new ADMIN (${adminEmail}).`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Admin bootstrap verification completed.');
};

bootstrapAdmins()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Admin bootstrap failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
