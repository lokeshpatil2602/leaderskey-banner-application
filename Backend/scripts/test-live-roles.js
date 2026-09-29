const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { User } = require('../src/modules/auth/auth.model');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'https://leaderskey-banner-application.onrender.com/api';

async function runLiveVerification() {
  console.log('=== RUNNING LIVE ROLE VERIFICATION ON RENDER ===');
  console.log('API Base:', API_BASE);
  const results = {};

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  // 1. Role counts
  const userCount = await User.countDocuments({ role: 'USER' });
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });

  results.userCount = userCount;
  results.adminCount = adminCount;
  results.superAdminCount = superAdminCount;

  const adminRecords = await User.find({ role: 'ADMIN' }, { email: 1, isActive: 1, _id: 0 });
  results.adminRecords = adminRecords;

  const superAdminRecords = await User.find({ role: 'SUPER_ADMIN' }, { email: 1, isActive: 1, _id: 0 });
  results.superAdminRecords = superAdminRecords;

  // 2. Test USER registration, login, and restrictions
  const testUserEmail = `live_user_${Date.now()}@example.com`;
  const testUserPassword = 'TestUserPassword123!';
  let userToken = null;

  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Live User Verification',
        email: testUserEmail,
        password: testUserPassword
      })
    });
    const regJson = await regRes.json();

    if (regRes.status === 201 && regJson.data?.user?.role === 'USER') {
      results.userRegistrationRole = 'PASS';
    } else {
      results.userRegistrationRole = `FAIL (${regRes.status})`;
    }

    // Test USER Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: testUserPassword })
    });
    const loginJson = await loginRes.json();
    if (loginRes.status === 200 && loginJson.data?.user?.role === 'USER' && loginJson.data?.token) {
      results.userLogin = 'PASS';
      userToken = loginJson.data.token;
    } else {
      results.userLogin = `FAIL (${loginRes.status})`;
    }

    if (userToken) {
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const tmplRes = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthorized' })
      });
      const catRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized' })
      });

      if (usersRes.status === 403 && tmplRes.status === 403 && catRes.status === 403) {
        results.userRestriction = 'PASS';
      } else {
        results.userRestriction = `FAIL (users:${usersRes.status}, templates:${tmplRes.status}, categories:${catRes.status})`;
      }
    }
  } catch (e) {
    results.userRestriction = `FAIL (${e.message})`;
  }

  // 3. Ensure and test SUPER_ADMIN
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com').trim().toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdminSecret123!';

  let superAdminUser = await User.findOne({ email: superAdminEmail });
  if (!superAdminUser) {
    superAdminUser = await User.create({
      name: 'Super Administrator',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true
    });
  } else {
    superAdminUser.password = superAdminPassword;
    superAdminUser.role = 'SUPER_ADMIN';
    superAdminUser.isActive = true;
    await superAdminUser.save();
  }

  let superAdminToken = null;
  try {
    const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword })
    });
    const saLoginJson = await saLoginRes.json();
    if (saLoginRes.status === 200 && saLoginJson.data?.user?.role === 'SUPER_ADMIN' && saLoginJson.data?.token) {
      results.superAdminLogin = 'PASS';
      superAdminToken = saLoginJson.data.token;
    } else {
      results.superAdminLogin = `FAIL (${saLoginRes.status}: ${JSON.stringify(saLoginJson)})`;
    }
  } catch (e) {
    results.superAdminLogin = `FAIL (${e.message})`;
  }

  if (superAdminToken) {
    try {
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const usersJson = await usersRes.json();
      if (usersRes.status === 200 && Array.isArray(usersJson.data?.users || usersJson.data)) {
        results.superAdminUserManagement = 'PASS';
      } else {
        results.superAdminUserManagement = `FAIL (${usersRes.status})`;
      }
    } catch (e) {
      results.superAdminUserManagement = `FAIL (${e.message})`;
    }
  }

  // 4. Ensure and test ADMIN
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@leaderskey.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecretPass123!';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'LeadersKey Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    });
  } else {
    adminUser.password = adminPassword;
    adminUser.role = 'ADMIN';
    adminUser.isActive = true;
    await adminUser.save();
  }

  let adminToken = null;
  try {
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const adminLoginJson = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'ADMIN' && adminLoginJson.data?.token) {
      results.adminLogin = 'PASS';
      adminToken = adminLoginJson.data.token;
    } else {
      results.adminLogin = `FAIL (${adminLoginRes.status}: ${JSON.stringify(adminLoginJson)})`;
    }
  } catch (e) {
    results.adminLogin = `FAIL (${e.message})`;
  }

  if (adminToken) {
    try {
      // ADMIN user management forbidden
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      results.adminUserManagement = usersRes.status === 403 ? 'PASS' : `FAIL (${usersRes.status})`;

      // ADMIN category management
      const catRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Live Admin Cat ${Date.now()}`,
          slug: `live-admin-cat-${Date.now()}`,
          icon: 'tag'
        })
      });
      const catJson = await catRes.json();
      if (catRes.status === 201) {
        results.adminCategoryManagement = 'PASS';
        const catId = catJson.data?.category?._id || catJson.data?.category?.id || catJson.data?._id || catJson.data?.id;
        if (catId) {
          await fetch(`${API_BASE}/categories/${catId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        }
      } else {
        results.adminCategoryManagement = `FAIL (${catRes.status})`;
      }

      // ADMIN template management
      const tmplRes = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Admin Test Banner ${Date.now()}`,
          category: 'General',
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
          background: { type: 'color', color: '#ffffff' },
          elements: []
        })
      });
      const tmplJson = await tmplRes.json();
      if (tmplRes.status === 201) {
        results.adminTemplateManagement = 'PASS';
        const tmplId = tmplJson.data?.template?._id || tmplJson.data?.template?.id || tmplJson.data?._id || tmplJson.data?.id;
        if (tmplId) {
          await fetch(`${API_BASE}/templates/${tmplId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        }
      } else {
        results.adminTemplateManagement = `FAIL (${tmplRes.status})`;
      }
    } catch (e) {
      console.error('ADMIN permission error:', e);
    }
  }

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log('FINAL LIVE RBAC TEST RESULTS:');
  console.log('========================================');
  console.log(JSON.stringify(results, null, 2));
}

runLiveVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
