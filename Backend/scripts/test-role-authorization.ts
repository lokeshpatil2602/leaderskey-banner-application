import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app';
import { User } from '../src/modules/auth/auth.model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

type RequestOptions = {
  method?: string;
  token?: string;
  body?: any;
};

const apiCall = async (endpoint: string, options: RequestOptions = {}): Promise<{ status: number; data: any }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data: any = await res.json().catch(() => null);
  return { status: res.status, data };
};

let totalPassed = 0;
let totalFailed = 0;

const assert = (name: string, condition: boolean, details?: string) => {
  if (condition) {
    console.log(`  ✓ ${name}`);
    totalPassed++;
  } else {
    console.error(`  ✗ ${name} — FAILED: ${details || 'Condition false'}`);
    totalFailed++;
  }
};

const runTests = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not configured in .env');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  await startServer();

  console.log('\n--- SECTION 1: Unauthenticated Access (Expect 401 Unauthorized) ---');
  {
    const res1 = await apiCall('/auth/me');
    assert('GET /api/auth/me returns 401 without token', res1.status === 401, `Got ${res1.status}`);

    const res2 = await apiCall('/templates');
    assert('GET /api/templates returns 401 without token', res2.status === 401, `Got ${res2.status}`);

    const res3 = await apiCall('/templates', { method: 'POST', body: { title: 'Test' } });
    assert('POST /api/templates returns 401 without token', res3.status === 401, `Got ${res3.status}`);

    const res4 = await apiCall('/categories');
    assert('GET /api/categories returns 401 without token', res4.status === 401, `Got ${res4.status}`);

    const res5 = await apiCall('/users');
    assert('GET /api/users returns 401 without token', res5.status === 401, `Got ${res5.status}`);
  }

  // Setup test account
  const testEmail = 'rbac-tester@bannerapp.test';
  const testPassword = 'Password123!';
  const testName = 'RBAC Tester';

  await User.deleteOne({ email: testEmail });
  const testUser = await User.create({
    name: testName,
    email: testEmail,
    password: testPassword,
    role: 'USER',
    isActive: true
  });

  console.log('\n--- SECTION 2: Role USER Authorization Testing ---');
  {
    // Ensure role is USER
    await User.findByIdAndUpdate(testUser._id, { role: 'USER' });

    const loginRes = await apiCall('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    assert('USER login succeeds', loginRes.status === 200);
    const userToken = loginRes.data?.data?.token;
    assert('JWT token received', Boolean(userToken));

    const meRes = await apiCall('/auth/me', { token: userToken });
    assert('GET /api/auth/me returns 200 with role USER', meRes.status === 200 && meRes.data?.data?.role === 'USER');

    // Allowed for USER
    const getTemplatesRes = await apiCall('/templates', { token: userToken });
    assert('GET /api/templates allowed (200 OK) for USER', getTemplatesRes.status === 200);

    const getCategoriesRes = await apiCall('/categories', { token: userToken });
    assert('GET /api/categories allowed (200 OK) for USER', getCategoriesRes.status === 200);

    // Forbidden for USER
    const postTemplateRes = await apiCall('/templates', {
      method: 'POST',
      token: userToken,
      body: { title: 'User Template', category: 'Marketing' }
    });
    assert('POST /api/templates forbidden (403) for USER', postTemplateRes.status === 403, `Got ${postTemplateRes.status}`);

    const deleteTemplateRes = await apiCall('/templates/tmpl-1', {
      method: 'DELETE',
      token: userToken
    });
    assert('DELETE /api/templates/:id forbidden (403) for USER', deleteTemplateRes.status === 403, `Got ${deleteTemplateRes.status}`);

    const postCategoryRes = await apiCall('/categories', {
      method: 'POST',
      token: userToken,
      body: { name: 'User Cat' }
    });
    assert('POST /api/categories forbidden (403) for USER', postCategoryRes.status === 403, `Got ${postCategoryRes.status}`);

    const getUsersRes = await apiCall('/users', { token: userToken });
    assert('GET /api/users forbidden (403) for USER', getUsersRes.status === 403, `Got ${getUsersRes.status}`);

    const patchRoleRes = await apiCall(`/users/${testUser._id}/role`, {
      method: 'PATCH',
      token: userToken,
      body: { role: 'ADMIN' }
    });
    assert('PATCH /api/users/:id/role forbidden (403) for USER', patchRoleRes.status === 403, `Got ${patchRoleRes.status}`);
  }

  console.log('\n--- SECTION 3: Role ADMIN Authorization Testing ---');
  {
    // Change role in MongoDB to ADMIN
    await User.findByIdAndUpdate(testUser._id, { role: 'ADMIN' });

    const loginRes = await apiCall('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    assert('ADMIN login succeeds', loginRes.status === 200);
    const adminToken = loginRes.data?.data?.token;

    const meRes = await apiCall('/auth/me', { token: adminToken });
    assert('GET /api/auth/me returns 200 with role ADMIN', meRes.status === 200 && meRes.data?.data?.role === 'ADMIN');

    // Allowed for ADMIN
    const createTemplateRes = await apiCall('/templates', {
      method: 'POST',
      token: adminToken,
      body: { title: 'Admin Banner', category: 'Events', dimensions: '1200x630' }
    });
    assert('POST /api/templates allowed (201 Created) for ADMIN', createTemplateRes.status === 201, `Got ${createTemplateRes.status}`);
    const createdTemplateId = createTemplateRes.data?.data?.id;

    const updateTemplateRes = await apiCall(`/templates/${createdTemplateId}`, {
      method: 'PUT',
      token: adminToken,
      body: { title: 'Admin Banner Updated' }
    });
    assert('PUT /api/templates/:id allowed (200 OK) for ADMIN', updateTemplateRes.status === 200, `Got ${updateTemplateRes.status}`);

    const deleteTemplateRes = await apiCall(`/templates/${createdTemplateId}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert('DELETE /api/templates/:id allowed (200 OK) for ADMIN', deleteTemplateRes.status === 200, `Got ${deleteTemplateRes.status}`);

    const runId = Date.now();
    const createCategoryRes = await apiCall('/categories', {
      method: 'POST',
      token: adminToken,
      body: { name: `Admin Category ${runId}` }
    });
    assert('POST /api/categories allowed (201 Created) for ADMIN', createCategoryRes.status === 201, `Got ${createCategoryRes.status}`);
    const createdCategoryId = createCategoryRes.data?.data?.id;

    const updateCategoryRes = await apiCall(`/categories/${createdCategoryId}`, {
      method: 'PUT',
      token: adminToken,
      body: { name: `Admin Category Updated ${runId}` }
    });
    assert('PUT /api/categories/:id allowed (200 OK) for ADMIN', updateCategoryRes.status === 200, `Got ${updateCategoryRes.status}`);

    const deleteCategoryRes = await apiCall(`/categories/${createdCategoryId}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert('DELETE /api/categories/:id allowed (200 OK) for ADMIN', deleteCategoryRes.status === 200, `Got ${deleteCategoryRes.status}`);

    // Forbidden for ADMIN (Super Admin only routes)
    const getUsersRes = await apiCall('/users', { token: adminToken });
    assert('GET /api/users forbidden (403) for ADMIN', getUsersRes.status === 403, `Got ${getUsersRes.status}`);

    const patchRoleRes = await apiCall(`/users/${testUser._id}/role`, {
      method: 'PATCH',
      token: adminToken,
      body: { role: 'SUPER_ADMIN' }
    });
    assert('PATCH /api/users/:id/role forbidden (403) for ADMIN', patchRoleRes.status === 403, `Got ${patchRoleRes.status}`);
  }

  console.log('\n--- SECTION 4: Role SUPER_ADMIN Authorization Testing ---');
  {
    // Change role in MongoDB to SUPER_ADMIN
    await User.findByIdAndUpdate(testUser._id, { role: 'SUPER_ADMIN' });

    const loginRes = await apiCall('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    assert('SUPER_ADMIN login succeeds', loginRes.status === 200);
    const superAdminToken = loginRes.data?.data?.token;

    const meRes = await apiCall('/auth/me', { token: superAdminToken });
    assert('GET /api/auth/me returns 200 with role SUPER_ADMIN', meRes.status === 200 && meRes.data?.data?.role === 'SUPER_ADMIN');

    // Super Admin can do templates
    const postTemplateRes = await apiCall('/templates', {
      method: 'POST',
      token: superAdminToken,
      body: { title: 'Super Admin Banner', category: 'Seasonal' }
    });
    assert('POST /api/templates allowed (201) for SUPER_ADMIN', postTemplateRes.status === 201);

    // Super Admin can do categories
    const postCatRes = await apiCall('/categories', {
      method: 'POST',
      token: superAdminToken,
      body: { name: `Super Admin Category ${Date.now()}` }
    });
    assert('POST /api/categories allowed (201) for SUPER_ADMIN', postCatRes.status === 201);
    const superCatId = postCatRes.data?.data?.id;
    if (superCatId) {
      await apiCall(`/categories/${superCatId}`, { method: 'DELETE', token: superAdminToken });
    }

    // Super Admin can view all users
    const getUsersRes = await apiCall('/users', { token: superAdminToken });
    assert('GET /api/users allowed (200) for SUPER_ADMIN', getUsersRes.status === 200 && Array.isArray(getUsersRes.data?.data));

    // Super Admin can change user roles for another user
    const dummyUser = await User.create({
      name: 'Dummy Target',
      email: `dummy-${Date.now()}@bannerapp.test`,
      password: 'Password123!',
      role: 'USER'
    });

    const patchRoleRes = await apiCall(`/users/${dummyUser._id}/role`, {
      method: 'PATCH',
      token: superAdminToken,
      body: { role: 'ADMIN' }
    });
    assert('PATCH /api/users/:id/role allowed (200) for SUPER_ADMIN', patchRoleRes.status === 200 && patchRoleRes.data?.data?.role === 'ADMIN');

    const patchStatusRes = await apiCall(`/users/${dummyUser._id}/status`, {
      method: 'PATCH',
      token: superAdminToken,
      body: { isActive: false }
    });
    assert('PATCH /api/users/:id/status allowed (200) for SUPER_ADMIN', patchStatusRes.status === 200 && patchStatusRes.data?.data?.isActive === false);

    // Cleanup dummy user & test user
    await User.deleteMany({ email: { $in: [testEmail, dummyUser.email] } });
  }

  console.log(`\n========================================`);
  console.log(`RBAC Test Results: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log(`========================================\n`);

  await stopServer();
  await mongoose.disconnect();

  if (totalFailed > 0) {
    process.exit(1);
  }
};

runTests().catch(async (err) => {
  console.error('Test execution failed:', err);
  await stopServer();
  await mongoose.disconnect();
  process.exit(1);
});
