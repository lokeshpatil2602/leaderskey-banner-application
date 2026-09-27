import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/modules/auth/auth.model';
import { Template } from '../src/modules/templates/template.model';
import { seedInitialTemplates } from '../src/modules/templates/template.service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

type HttpResult = {
  status: number;
  data: any;
};

const runRequest = async (
  method: string,
  urlPath: string,
  token?: string,
  body?: Record<string, unknown>
): Promise<HttpResult> => {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const server = app.listen(0, async () => {
      const port = (server.address() as any).port;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const postData = body ? JSON.stringify(body) : undefined;
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData).toString();
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: urlPath,
          method,
          headers
        },
        (res: any) => {
          let rawData = '';
          res.on('data', (chunk: any) => {
            rawData += chunk;
          });
          res.on('end', () => {
            server.close();
            try {
              const parsed = rawData ? JSON.parse(rawData) : null;
              resolve({ status: res.statusCode, data: parsed });
            } catch (err) {
              resolve({ status: res.statusCode, data: rawData });
            }
          });
        }
      );

      req.on('error', (err: any) => {
        server.close();
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  });
};

const loginOrRegister = async (name: string, email: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
  const password = 'Password123!';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      role,
      isActive: true
    });
  } else {
    user.role = role;
    user.isActive = true;
    await user.save();
  }

  const res = await runRequest('POST', '/api/auth/login', undefined, {
    email,
    password
  });

  if (res.status !== 200 || !res.data?.data?.token) {
    // If login failed due to password hash, update user password
    user.password = password;
    await user.save();
    const retryRes = await runRequest('POST', '/api/auth/login', undefined, {
      email,
      password
    });
    return retryRes.data.data.token;
  }

  return res.data.data.token;
};

const runFeature5Verification = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  // Ensure seed data is initialized
  await seedInitialTemplates();
  const templateCount = await Template.countDocuments();
  console.log(`Current templates in MongoDB: ${templateCount}`);

  console.log('\n--- 1. Authenticating Roles ---');
  const userToken = await loginOrRegister('Test User F5', 'user_f5@example.com', 'USER');
  const adminToken = await loginOrRegister('Test Admin F5', 'admin_f5@example.com', 'ADMIN');
  const superAdminToken = await loginOrRegister('Test Super Admin F5', 'superadmin_f5@example.com', 'SUPER_ADMIN');

  console.log('✓ Tokens generated for USER, ADMIN, SUPER_ADMIN.');

  console.log('\n--- 2. Testing Unauthenticated Access ---');
  const unauthRes = await runRequest('GET', '/api/templates');
  console.log(`Unauth GET /api/templates status: ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) throw new Error('Unauthenticated access was not blocked with 401');

  console.log('\n--- 3. Testing USER Role Capabilities & Restrictions ---');
  const userGetRes = await runRequest('GET', '/api/templates', userToken);
  console.log(`USER GET /api/templates: ${userGetRes.status}, items: ${userGetRes.data?.data?.length}`);
  if (userGetRes.status !== 200 || !Array.isArray(userGetRes.data?.data)) {
    throw new Error('USER failed to get templates');
  }

  const sampleTemplate = userGetRes.data.data[0];
  const userGetOneRes = await runRequest('GET', `/api/templates/${sampleTemplate.id}`, userToken);
  console.log(`USER GET /api/templates/:id: ${userGetOneRes.status} for "${sampleTemplate.title}"`);
  if (userGetOneRes.status !== 200) throw new Error('USER failed to get single template');

  const userFilterRes = await runRequest('GET', '/api/templates?category=Politics', userToken);
  console.log(`USER GET /api/templates?category=Politics: ${userFilterRes.status}, items: ${userFilterRes.data?.data?.length}`);
  if (userFilterRes.status !== 200) throw new Error('USER failed category filter');

  // Verify USER is blocked from modifications
  const userPostRes = await runRequest('POST', '/api/templates', userToken, {
    title: 'Unauthorized Banner',
    category: 'Politics',
    imageUrl: 'https://example.com/test.png'
  });
  console.log(`USER POST /api/templates: ${userPostRes.status} (Expected: 403)`);
  if (userPostRes.status !== 403) throw new Error('USER was not forbidden from creating templates');

  const userPutRes = await runRequest('PUT', `/api/templates/${sampleTemplate.id}`, userToken, {
    title: 'Unauthorized Edit'
  });
  console.log(`USER PUT /api/templates/:id: ${userPutRes.status} (Expected: 403)`);
  if (userPutRes.status !== 403) throw new Error('USER was not forbidden from updating templates');

  const userDelRes = await runRequest('DELETE', `/api/templates/${sampleTemplate.id}`, userToken);
  console.log(`USER DELETE /api/templates/:id: ${userDelRes.status} (Expected: 403)`);
  if (userDelRes.status !== 403) throw new Error('USER was not forbidden from deleting templates');

  console.log('\n--- 4. Testing ADMIN Role Capabilities ---');
  // Create
  const adminPostRes = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Admin Created Test Banner',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
  });
  console.log(`ADMIN POST /api/templates: ${adminPostRes.status}, id: ${adminPostRes.data?.data?.id}`);
  if (adminPostRes.status !== 201) throw new Error('ADMIN failed to create template');
  const createdId = adminPostRes.data.data.id;

  // Edit
  const adminPutRes = await runRequest('PUT', `/api/templates/${createdId}`, adminToken, {
    title: 'Admin Updated Banner Title',
    category: 'Education'
  });
  console.log(`ADMIN PUT /api/templates/:id: ${adminPutRes.status}, new title: "${adminPutRes.data?.data?.title}"`);
  if (adminPutRes.status !== 200 || adminPutRes.data.data.title !== 'Admin Updated Banner Title') {
    throw new Error('ADMIN failed to update template');
  }

  // Delete
  const adminDelRes = await runRequest('DELETE', `/api/templates/${createdId}`, adminToken);
  console.log(`ADMIN DELETE /api/templates/:id: ${adminDelRes.status}`);
  if (adminDelRes.status !== 200) throw new Error('ADMIN failed to delete template');

  console.log('\n--- 5. Testing SUPER_ADMIN Role Capabilities ---');
  // Create
  const superPostRes = await runRequest('POST', '/api/templates', superAdminToken, {
    title: 'Super Admin Test Banner',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
  });
  console.log(`SUPER_ADMIN POST /api/templates: ${superPostRes.status}, id: ${superPostRes.data?.data?.id}`);
  if (superPostRes.status !== 201) throw new Error('SUPER_ADMIN failed to create template');
  const superCreatedId = superPostRes.data.data.id;

  // Update
  const superPutRes = await runRequest('PUT', `/api/templates/${superCreatedId}`, superAdminToken, {
    isActive: false
  });
  console.log(`SUPER_ADMIN PUT /api/templates/:id: ${superPutRes.status}, isActive: ${superPutRes.data?.data?.isActive}`);
  if (superPutRes.status !== 200 || superPutRes.data.data.isActive !== false) {
    throw new Error('SUPER_ADMIN failed to update template');
  }

  // Delete
  const superDelRes = await runRequest('DELETE', `/api/templates/${superCreatedId}`, superAdminToken);
  console.log(`SUPER_ADMIN DELETE /api/templates/:id: ${superDelRes.status}`);
  if (superDelRes.status !== 200) throw new Error('SUPER_ADMIN failed to delete template');

  await mongoose.disconnect();
  console.log('\n========================================');
  console.log('FEATURE 5 VERIFICATION PASSED SUCCESSFULLY');
  console.log('========================================');
};

runFeature5Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Feature 5 verification failed:', err);
    process.exit(1);
  });
