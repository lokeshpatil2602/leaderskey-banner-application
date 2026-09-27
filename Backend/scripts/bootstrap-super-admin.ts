import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/auth.model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const bootstrapSuperAdmin = async (): Promise<void> => {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = (process.env.SUPER_ADMIN_PASSWORD ?? '').trim();
  const name = (process.env.SUPER_ADMIN_NAME ?? 'System Administrator').trim();

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured before bootstrapping.');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured before bootstrapping.');
  }

  await mongoose.connect(mongoUri);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.role = 'SUPER_ADMIN';
    existingUser.isActive = true;
    await existingUser.save();
    console.log(`Existing user promoted to SUPER_ADMIN: ${existingUser.email}`);
    await mongoose.disconnect();
    return;
  }

  const newUser = await User.create({
    name,
    email,
    password,
    role: 'SUPER_ADMIN',
    isActive: true
  });

  console.log(`Created SUPER_ADMIN user: ${newUser.email}`);
  await mongoose.disconnect();
};

bootstrapSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('SUPER_ADMIN bootstrap failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
