import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { seedInitialTemplates } from '../src/modules/templates/template.service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedDatabase() {
  console.log('=== STARTING DATABASE SEEDING ===');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banner_app';
  console.log(`Connecting to database...`);
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  await seedInitialTemplates();
  console.log('✓ Initial templates and multi-size presets successfully seeded.');

  await mongoose.disconnect();
  console.log('=== DATABASE SEEDING COMPLETED ===');
}

seedDatabase().catch((err) => {
  console.error('Seeding Failed:', err);
  process.exit(1);
});
