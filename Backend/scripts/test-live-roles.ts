import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/modules/auth/auth.model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'https://leaderskey-banner-application.onrender.com/api';

async function verifyRoles() {
  console.log('=== VERIFYING LIVE ADMIN & SUPER_ADMIN FLOWS ===');
  await mongoose.connect(process.env.MONGODB_URI as string);

  const results: Record<string, any> = {};

  // 1. Role counts
  results.userCount = await User.countDocuments({ role: 'USER' });
  results.adminCount = await User.countDocuments({ role: 'ADMIN' });
  results.superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });

  const adminRecords = await User.find({ role: 'ADMIN' }, { email: 1, isActive: 1, _id: 0 });
  results.adminRecords = adminRecords;

  const superAdminRecords = await User.find({ role: 'SUPER_ADMIN' }, { email: 1, isActive: 1, _id: 0 });
  results.superAdminRecords = superAdminRecords;

  // 2. USER Registration + Login + Restrictions
  const userEmail = `user_verify_${Date.now()}@example.com`;
  const userPassword = 'TestUserSecret123!';

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Verified User', email: userEmail, password: userPassword })
  });
  const regJson: any = await regRes.json();
  results.userRegistrationCreatesUserOnly = regRes.status === 201 && regJson.data?.user?.role === 'USER' ? 'PASS' : 'FAIL';

  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  const userLoginJson: any = await userLoginRes.json();
  const userToken = userLoginJson.data?.token;

  if (userToken) {
    const uUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${userToken}` } });
    const uTmpl = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauth' })
    });
    const uCat = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauth' })
    });
    results.userRestriction = uUsers.status === 403 && uTmpl.status === 403 && uCat.status === 403 ? 'PASS' : 'FAIL';
  }

  // 3. ADMIN Registration via Render API, then role promote in Atlas
  const adminEmail = `admin_verify_${Date.now()}@example.com`;
  const adminPassword = 'AdminSecretLive123!';

  const adminReg = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'LeadersKey Admin', email: adminEmail, password: adminPassword })
  });
  const adminRegJson: any = await adminReg.json();

  if (adminReg.status === 201) {
    // Promote role to ADMIN directly in database without touching password
    await User.updateOne({ email: adminEmail }, { $set: { role: 'ADMIN', isActive: true } });

    // Test ADMIN Login
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const adminLoginJson: any = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'ADMIN' && adminLoginJson.data?.token) {
      results.adminLogin = 'PASS';
      results.adminEmailTested = adminEmail;
      const adminToken = adminLoginJson.data.token;

      // Test ADMIN Permissions
      const aUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
      results.adminUserManagementForbidden = aUsers.status === 403 ? 'PASS' : `FAIL (${aUsers.status})`;

      // Category management
      const aCat = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Cat ${Date.now()}`, slug: `cat-${Date.now()}`, icon: 'tag' })
      });
      const aCatJson: any = await aCat.json();
      if (aCat.status === 201) {
        results.adminCategoryManagement = 'PASS';
        const cId = aCatJson.data?.category?._id || aCatJson.data?.category?.id || aCatJson.data?._id || aCatJson.data?.id;
        if (cId) {
          await fetch(`${API_BASE}/categories/${cId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        }
      } else {
        results.adminCategoryManagement = 'FAIL';
      }

      // Template management
      const aTmpl = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Template ${Date.now()}`,
          category: 'General',
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
          background: { type: 'color', color: '#ffffff' },
          elements: []
        })
      });
      const aTmplJson: any = await aTmpl.json();
      if (aTmpl.status === 201) {
        results.adminTemplateManagement = 'PASS';
        const tId = aTmplJson.data?.template?._id || aTmplJson.data?.template?.id || aTmplJson.data?._id || aTmplJson.data?.id;
        if (tId) {
          await fetch(`${API_BASE}/templates/${tId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        }
      } else {
        results.adminTemplateManagement = 'FAIL';
      }
    } else {
      results.adminLogin = `FAIL (${adminLoginRes.status})`;
    }
  }

  // 4. SUPER_ADMIN Registration via Render API, then role promote in Atlas
  const saEmail = `superadmin_verify_${Date.now()}@example.com`;
  const saPassword = 'SuperAdminSecretLive123!';

  const saReg = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Super Admin', email: saEmail, password: saPassword })
  });
  if (saReg.status === 201) {
    await User.updateOne({ email: saEmail }, { $set: { role: 'SUPER_ADMIN', isActive: true } });

    const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: saEmail, password: saPassword })
    });
    const saLoginJson: any = await saLoginRes.json();
    if (saLoginRes.status === 200 && saLoginJson.data?.user?.role === 'SUPER_ADMIN' && saLoginJson.data?.token) {
      results.superAdminLogin = 'PASS';
      results.superAdminEmailTested = saEmail;
      const saToken = saLoginJson.data.token;

      const saUsers = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${saToken}` } });
      const saUsersJson: any = await saUsers.json();
      results.superAdminUserManagement = saUsers.status === 200 && Array.isArray(saUsersJson.data?.users || saUsersJson.data) ? 'PASS' : 'FAIL';
    } else {
      results.superAdminLogin = `FAIL (${saLoginRes.status})`;
    }
  }

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log('FINAL LIVE RBAC REPORT RESULTS:');
  console.log('========================================');
  console.log(JSON.stringify(results, null, 2));
}

verifyRoles().catch(console.error);
