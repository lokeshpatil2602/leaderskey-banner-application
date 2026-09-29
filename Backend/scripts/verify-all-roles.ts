import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/auth.model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'https://leaderskey-banner-application.onrender.com/api';

async function verifyAllRoles() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  // 1. Check Counts
  const userCount = await User.countDocuments({ role: 'USER' });
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });

  const adminList = await User.find({ role: 'ADMIN' }, { email: 1, isActive: 1, _id: 0 });
  const superAdminRecord = await User.findOne({ role: 'SUPER_ADMIN' }, { email: 1, isActive: 1, _id: 0 });

  // 2. Register & Test USER
  const userEmail = `user_${Date.now()}@example.com`;
  const userPassword = 'TestUser123!';

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Normal User', email: userEmail, password: userPassword })
  });
  const regData: any = await regRes.json();
  const userRegPass = regRes.status === 201 && regData.data?.user?.role === 'USER';

  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  const userLoginData: any = await userLoginRes.json();
  const userToken = userLoginData.data?.token;

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

  // 3. Register & Test ADMIN
  const adminEmail = `admin_test_${Date.now()}@example.com`;
  const adminPassword = 'AdminPassword123!';

  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Admin', email: adminEmail, password: adminPassword })
  });

  // Promote in DB
  await User.updateOne({ email: adminEmail }, { $set: { role: 'ADMIN', isActive: true } });

  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  const adminLoginData: any = await adminLoginRes.json();
  const adminLoginPass = adminLoginRes.status === 200 && adminLoginData.data?.user?.role === 'ADMIN';
  const adminToken = adminLoginData.data?.token;

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
    const aCatData: any = await aCat.json();
    adminCategoryPass = aCat.status === 201;
    const catId = aCatData.data?.category?._id || aCatData.data?.category?.id || aCatData.data?._id || aCatData.data?.id;
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
    const aTmplData: any = await aTmpl.json();
    adminTemplatePass = aTmpl.status === 201;
    const tmplId = aTmplData.data?.template?._id || aTmplData.data?.template?.id || aTmplData.data?._id || aTmplData.data?.id;
    if (tmplId) {
      await fetch(`${API_BASE}/templates/${tmplId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    }
  }

  // 4. Register & Test SUPER_ADMIN
  const saEmail = `sa_test_${Date.now()}@example.com`;
  const saPassword = 'SuperAdminPassword123!';

  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Super Admin', email: saEmail, password: saPassword })
  });

  await User.updateOne({ email: saEmail }, { $set: { role: 'SUPER_ADMIN', isActive: true } });

  const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: saEmail, password: saPassword })
  });
  const saLoginData: any = await saLoginRes.json();
  const saLoginPass = saLoginRes.status === 200 && saLoginData.data?.user?.role === 'SUPER_ADMIN';
  const saToken = saLoginData.data?.token;

  let saUserManagementPass = false;
  if (saToken) {
    const saUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${saToken}` } });
    const saUsersData: any = await saUsers.json();
    saUserManagementPass = saUsers.status === 200 && Array.isArray(saUsersData.data?.users || saUsersData.data || saUsersData.users);
  }

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log(`ADMIN count = ${adminCount}`);
  console.log(`Active ADMIN count = ${adminList.filter(a => a.isActive).length}`);
  console.log(`ADMIN emails in DB = ${JSON.stringify(adminList)}`);
  console.log(`SUPER_ADMIN count = ${superAdminCount}`);
  console.log(`SUPER_ADMIN email = ${superAdminRecord?.email || 'superadmin@example.com'}`);
  console.log(`ADMIN login = ${adminLoginPass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN template management = ${adminTemplatePass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN category management = ${adminCategoryPass ? 'PASS' : 'FAIL'}`);
  console.log(`ADMIN user management = ${adminUserManagementPass ? 'PASS' : 'FAIL'}`);
  console.log(`SUPER_ADMIN login = ${saLoginPass ? 'PASS' : 'FAIL'}`);
  console.log(`SUPER_ADMIN user management = ${saUserManagementPass ? 'PASS' : 'FAIL'}`);
  console.log(`USER restriction = ${userRegPass && userRestrictionPass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
}

verifyAllRoles().catch(console.error);
