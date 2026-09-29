const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../Backend/.env') });

const API_BASE = 'https://leaderskey-banner-application.onrender.com/api';

async function testRoles() {
  console.log('Testing Live Production API at:', API_BASE);
  const results = {};

  // 1. SUPER_ADMIN Login Test
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  let superAdminToken = null;
  if (superAdminPassword) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword })
      });
      const data = await res.json();
      if (res.status === 200 && data.token && data.user?.role === 'SUPER_ADMIN') {
        results.superAdminLogin = 'PASS';
        superAdminToken = data.token;
      } else {
        results.superAdminLogin = `FAIL (${res.status}: ${data.message || 'Unknown'})`;
      }
    } catch (e) {
      results.superAdminLogin = `FAIL (${e.message})`;
    }
  } else {
    results.superAdminLogin = 'SKIPPED (SUPER_ADMIN_PASSWORD not set in local env)';
  }

  // 2. SUPER_ADMIN User Management Check
  if (superAdminToken) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.users)) {
        results.superAdminUserManagement = 'PASS';
      } else {
        results.superAdminUserManagement = `FAIL (${res.status})`;
      }
    } catch (e) {
      results.superAdminUserManagement = `FAIL (${e.message})`;
    }
  }

  // 3. New USER Registration and Restrictions Test
  const testUserEmail = `user_test_${Date.now()}@example.com`;
  const testUserPassword = 'TestUserPass123!';
  let userToken = null;

  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testUserEmail,
        password: testUserPassword
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.user?.role === 'USER') {
      results.userRegistrationRole = 'PASS';
      userToken = regData.token;
    } else {
      results.userRegistrationRole = `FAIL (${regRes.status})`;
    }

    if (userToken) {
      // Test restricted routes
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const templatesRes = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthorized' })
      });
      const categoriesRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized' })
      });

      if (usersRes.status === 403 && templatesRes.status === 403 && categoriesRes.status === 403) {
        results.userRestriction = 'PASS';
      } else {
        results.userRestriction = `FAIL (users:${usersRes.status}, templates:${templatesRes.status}, categories:${categoriesRes.status})`;
      }
    }
  } catch (e) {
    results.userRestriction = `FAIL (${e.message})`;
  }

  // 4. ADMIN Creation & Verification using SUPER_ADMIN authority
  // Let's create a designated single ADMIN or test admin login
  const testAdminEmail = `admin_live_${Date.now()}@example.com`;
  const testAdminPassword = 'AdminPassLive123!';
  let adminToken = null;

  if (superAdminToken) {
    try {
      // Register user then promote to ADMIN
      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'LeadersKey Admin',
          email: testAdminEmail,
          password: testAdminPassword
        })
      });
      const regData = await regRes.json();
      const adminUserId = regData.user?.id;

      // Promote to ADMIN using SUPER_ADMIN
      const promoteRes = await fetch(`${API_BASE}/users/${adminUserId}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'ADMIN' })
      });

      if (promoteRes.status === 200) {
        // Test ADMIN Login
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword })
        });
        const loginData = await loginRes.json();
        if (loginRes.status === 200 && loginData.user?.role === 'ADMIN' && loginData.token) {
          results.adminLogin = 'PASS';
          adminToken = loginData.token;
        } else {
          results.adminLogin = `FAIL (${loginRes.status})`;
        }
      }
    } catch (e) {
      results.adminLogin = `FAIL (${e.message})`;
    }
  }

  // 5. Test ADMIN Permissions
  if (adminToken) {
    try {
      // ADMIN should be forbidden from /api/users
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (usersRes.status === 403) {
        results.adminUserManagementForbidden = 'PASS';
      } else {
        results.adminUserManagementForbidden = `FAIL (${usersRes.status})`;
      }

      // ADMIN should be allowed to manage categories
      const catRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Test Cat ${Date.now()}`,
          slug: `test-cat-${Date.now()}`,
          icon: 'tag'
        })
      });
      const catData = await catRes.json();
      if (catRes.status === 201) {
        results.adminCategoryManagement = 'PASS';
        // Clean up created category
        if (catData.category?.id || catData.category?._id) {
          await fetch(`${API_BASE}/categories/${catData.category.id || catData.category._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        }
      } else {
        results.adminCategoryManagement = `FAIL (${catRes.status})`;
      }

      // ADMIN should be allowed to manage templates
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
      const tmplData = await tmplRes.json();
      if (tmplRes.status === 201) {
        results.adminTemplateManagement = 'PASS';
        if (tmplData.template?.id || tmplData.template?._id) {
          await fetch(`${API_BASE}/templates/${tmplData.template.id || tmplData.template._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        }
      } else {
        results.adminTemplateManagement = `FAIL (${tmplRes.status})`;
      }
    } catch (e) {
      console.error('Error during ADMIN permission test:', e);
    }
  }

  console.log('\n=== LIVE TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
}

testRoles().catch(console.error);
