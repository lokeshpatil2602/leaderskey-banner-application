const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyPersistence() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const adminUsers = await db.collection('users').find(
    { role: { $in: ['SUPER_ADMIN', 'ADMIN'] } },
    { projection: { email: 1, role: 1, isActive: 1, _id: 0 } }
  ).toArray();

  const totalUsers = await db.collection('users').countDocuments();
  const totalBanners = await db.collection('banners').countDocuments();
  const totalTemplates = await db.collection('templates').countDocuments();

  console.log('--- ADMIN / SUPER_ADMIN ACCOUNTS ---');
  adminUsers.forEach(u => console.log(`Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`));

  console.log('\n--- COLLECTION METRICS ---');
  console.log(`Database Name: ${mongoose.connection.name}`);
  console.log(`Total Users in test.users: ${totalUsers}`);
  console.log(`Total Banners in test.banners: ${totalBanners}`);
  console.log(`Total Templates in test.templates: ${totalTemplates}`);

  await mongoose.disconnect();
}

verifyPersistence().catch(err => {
  console.error(err);
  process.exit(1);
});
