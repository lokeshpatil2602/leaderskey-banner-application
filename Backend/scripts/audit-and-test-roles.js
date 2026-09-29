const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'https://leaderskey-banner-application.onrender.com/api';

async function checkAndTestProduction() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, { dbName: 'test' });
  const db = mongoose.connection.db;

  console.log('Connected to database:', mongoose.connection.name);

  const usersCollection = db.collection('users');

  const userCount = await usersCollection.countDocuments({
    $or: [{ role: 'USER' }, { role: { $exists: false } }]
  });
  const adminCount = await usersCollection.countDocuments({ role: 'ADMIN' });
  const superAdminCount = await usersCollection.countDocuments({ role: 'SUPER_ADMIN' });

  const adminRecords = await usersCollection.find({ role: 'ADMIN' }, { projection: { email: 1, isActive: 1, role: 1, _id: 0 } }).toArray();
  const superAdminRecords = await usersCollection.find({ role: 'SUPER_ADMIN' }, { projection: { email: 1, isActive: 1, role: 1, _id: 0 } }).toArray();
  const userRecords = await usersCollection.find({ $or: [{ role: 'USER' }, { role: { $exists: false } }] }, { projection: { email: 1, isActive: 1, role: 1, _id: 0 } }).toArray();

  console.log('\n========================================');
  console.log('PRODUCTION ATLAS DATABASE "test" AUDIT:');
  console.log('========================================');
  console.log(`USER count: ${userCount}`);
  console.log(`ADMIN count: ${adminCount}`);
  console.log(`SUPER_ADMIN count: ${superAdminCount}`);

  console.log('\n--- ADMIN Accounts in test.users ---');
  adminRecords.forEach(a => console.log(`Email: ${a.email} | Active: ${a.isActive}`));

  console.log('\n--- SUPER_ADMIN Accounts in test.users ---');
  superAdminRecords.forEach(sa => console.log(`Email: ${sa.email} | Active: ${sa.isActive}`));

  console.log('\n--- USER Accounts in test.users ---');
  userRecords.forEach(u => console.log(`Email: ${u.email}`));

  // Now test live API role endpoints
  console.log('\n========================================');
  console.log('TESTING LIVE API ROLE PERMISSIONS:');
  console.log('========================================');

  // 1. Test USER
  const testUserEmail = `user_${Date.now()}@example.com`;
  const testUserPassword = 'TestPassword123!';

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Live User', email: testUserEmail, password: testUserPassword })
  });
  const regJson = await regRes.json();
  const userRegPass = regRes.status === 201 && regJson.data?.user?.role === 'USER';

  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUserEmail, password: testUserPassword })
  });
  const userLoginJson = await userLoginRes.json();
  const userToken = userLoginJson.data?.token;

  let userRestrictionPass = false;
  if (userToken) {
    const uUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${userToken}` } });
    const uTmpl = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauth' })
    });
    userRestrictionPass = uUsers.status === 403 && uTmpl.status === 403;
  }

  // 2. Test ADMIN
  const testAdminEmail = `admin_live_${Date.now()}@example.com`;
  const testAdminPassword = 'AdminPassword123!';

  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Live Admin', email: testAdminEmail, password: testAdminPassword })
  });

  // Promote to ADMIN in database `test`
  await usersCollection.updateOne({ email: testAdminEmail }, { $set: { role: 'ADMIN', isActive: true } });

  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword })
  });
  const adminLoginJson = await adminLoginRes.json();
  const adminLoginPass = adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'ADMIN';
  const adminToken = adminLoginJson.data?.token;

  let adminUserManagementPass = false;
  let adminCategoryPass = false;
  let adminTemplatePass = false;

  if (adminToken) {
    const aUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
    adminUserManagementPass = aUsers.status === 403;

    const aCat = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Cat ${Date.now()}`, slug: `cat-${Date.now()}`, icon: 'tag' })
    });
    const aCatJson = await aCat.json();
    adminCategoryPass = aCat.status === 201;
    const catId = aCatJson.data?.category?._id || aCatJson.data?.category?.id || aCatJson.data?._id || aCatJson.data?.id;
    if (catId) {
      await fetch(`${API_BASE}/categories/${catId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    }

    const aTmpl = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Banner ${Date.now()}`,
        category: 'General',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
        background: { type: 'color', color: '#ffffff' },
        elements: []
      })
    });
    const aTmplJson = await aTmpl.json();
    adminTemplatePass = aTmpl.status === 201;
    const tmplId = aTmplJson.data?.template?._id || aTmplJson.data?.template?.id || aTmplJson.data?._id || aTmplJson.data?.id;
    if (tmplId) {
      await fetch(`${API_BASE}/templates/${tmplId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    }

    // Clean up temporary test admin account
    await usersCollection.deleteOne({ email: testAdminEmail });
  }

  // 3. Test SUPER_ADMIN
  const testSaEmail = `superadmin_live_${Date.now()}@example.com`;
  const testSaPassword = 'SuperAdminPassword123!';

  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Live SuperAdmin', email: testSaEmail, password: testSaPassword })
  });

  await usersCollection.updateOne({ email: testSaEmail }, { $set: { role: 'SUPER_ADMIN', isActive: true } });

  const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testSaEmail, password: testSaPassword })
  });
  const saLoginJson = await saLoginRes.json();
  const saLoginPass = saLoginRes.status === 200 && saLoginJson.data?.user?.role === 'SUPER_ADMIN';
  const saToken = saLoginJson.data?.token;

  let saUserManagementPass = false;
  if (saToken) {
    const saUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${saToken}` } });
    const saUsersJson = await saUsers.json();
    saUserManagementPass = saUsers.status === 200 && Array.isArray(saUsersJson.data?.users || saUsersJson.data);

    // Clean up temporary test superadmin account
    await usersCollection.deleteOne({ email: testSaEmail });
  }

  // Clean up temporary test user
  await usersCollection.deleteOne({ email: testUserEmail });

  // Final count of canonical records in database `test`
  const finalUserCount = await usersCollection.countDocuments({
    $or: [{ role: 'USER' }, { role: { $exists: false } }]
  });
  const finalAdminCount = await usersCollection.countDocuments({ role: 'ADMIN' });
  const finalSuperAdminCount = await usersCollection.countDocuments({ role: 'SUPER_ADMIN' });
  const finalAdmin = await usersCollection.findOne({ role: 'ADMIN' });
  const finalSuperAdmin = await usersCollection.findOne({ role: 'SUPER_ADMIN' });

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log('FINAL PRODUCTION REPORT');
  console.log('========================================');
  console.log(`ADMIN count = ${finalAdminCount}`);
  console.log(`Active ADMIN count = ${finalAdmin?.isActive ? 1 : 0}`);
  console.log(`ADMIN email = ${finalAdmin?.email || 'None'}`);
  console.log(`SUPER_ADMIN count = ${finalSuperAdminCount}`);
  console.log(`SUPER_ADMIN email = ${finalSuperAdmin?.email || 'None'}`);
  console.log(`ADMIN login = ${adminLoginPass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN template management = ${adminTemplatePass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN category management = ${adminCategoryPass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN user management = ${adminUserManagementPass ? 'PASS' : 'FAIL'}`);
  console.log(`SUPER_ADMIN login = ${saLoginPass ? 'PASS' : 'FAIL'}`);
  console.log(`SUPER_ADMIN user management = ${saUserManagementPass ? 'PASS' : 'FAIL'}`);
  console.log(`USER restriction = ${userRegPass && userRestrictionPass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
}

checkAndTestProduction().catch(console.error);
