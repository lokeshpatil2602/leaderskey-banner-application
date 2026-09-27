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

const runFeature6Verification = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  await seedInitialTemplates();
  const sampleTemplate = await Template.findOne();
  if (!sampleTemplate) {
    throw new Error('No templates found in MongoDB.');
  }
  const templateId = sampleTemplate._id.toString();
  console.log(`Using sample template: "${sampleTemplate.title}" (${templateId})`);

  console.log('\n--- 1. Authenticating Roles ---');
  const userAToken = await loginOrRegister('User A', 'user_a_f6@example.com', 'USER');
  const userBToken = await loginOrRegister('User B', 'user_b_f6@example.com', 'USER');
  const adminToken = await loginOrRegister('Admin User', 'admin_f6@example.com', 'ADMIN');
  const superAdminToken = await loginOrRegister('Super Admin', 'superadmin_f6@example.com', 'SUPER_ADMIN');
  console.log('✓ Tokens generated for User A, User B, Admin, and Super Admin.');

  console.log('\n--- 2. Unauthenticated Access Protection ---');
  const unauthGet = await runRequest('GET', '/api/banners');
  console.log(`Unauthenticated GET /api/banners: ${unauthGet.status} (Expected: 401)`);
  if (unauthGet.status !== 401) throw new Error('Unauthenticated GET /api/banners was not blocked with 401');

  const unauthPost = await runRequest('POST', '/api/banners', undefined, {
    templateId,
    mainText: 'Unauthenticated Banner'
  });
  console.log(`Unauthenticated POST /api/banners: ${unauthPost.status} (Expected: 401)`);
  if (unauthPost.status !== 401) throw new Error('Unauthenticated POST /api/banners was not blocked with 401');

  console.log('\n--- 3. Validation Rules (Empty Main Text) ---');
  const emptyTextRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId,
    mainText: '   '
  });
  console.log(`Empty main text POST: ${emptyTextRes.status} (Expected: 400)`);
  if (emptyTextRes.status !== 400) throw new Error('Empty main text was not rejected with 400');

  console.log('\n--- 4. User A Creates & Retrieves Banner ---');
  const createBannerRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId,
    mainText: 'Happy Birthday Alice',
    secondaryText: 'Wishing you all the joy and happiness!'
  });
  console.log(`User A POST /api/banners: ${createBannerRes.status}, id: ${createBannerRes.data?.data?.id}`);
  if (createBannerRes.status !== 201) throw new Error('User A failed to create banner');
  const userABannerId = createBannerRes.data.data.id;

  const userABannersRes = await runRequest('GET', '/api/banners', userAToken);
  console.log(`User A GET /api/banners: ${userABannersRes.status}, count: ${userABannersRes.data?.data?.length}`);
  if (userABannersRes.status !== 200 || !userABannersRes.data.data.some((b: any) => b.id === userABannerId)) {
    throw new Error("User A's banner list does not include created banner");
  }

  const userAGetOne = await runRequest('GET', `/api/banners/${userABannerId}`, userAToken);
  console.log(`User A GET /api/banners/:id: ${userAGetOne.status}, mainText: "${userAGetOne.data?.data?.mainText}"`);
  if (userAGetOne.status !== 200 || userAGetOne.data.data.mainText !== 'Happy Birthday Alice') {
    throw new Error('User A failed to retrieve single banner');
  }

  console.log('\n--- 5. User Isolation (User B cannot access User A banner) ---');
  const userBBannersRes = await runRequest('GET', '/api/banners', userBToken);
  console.log(`User B GET /api/banners: count: ${userBBannersRes.data?.data?.length}`);
  const userBSeesUserABanner = userBBannersRes.data?.data?.some((b: any) => b.id === userABannerId);
  if (userBSeesUserABanner) {
    throw new Error('User B unexpectedly sees User A banner in list!');
  }
  console.log('✓ User B list does NOT contain User A banner.');

  const userBAccessUserABanner = await runRequest('GET', `/api/banners/${userABannerId}`, userBToken);
  console.log(`User B GET /api/banners/${userABannerId}: ${userBAccessUserABanner.status} (Expected: 403)`);
  if (userBAccessUserABanner.status !== 403) {
    throw new Error('User B was not forbidden from accessing User A banner');
  }

  const userBDeleteUserABanner = await runRequest('DELETE', `/api/banners/${userABannerId}`, userBToken);
  console.log(`User B DELETE /api/banners/${userABannerId}: ${userBDeleteUserABanner.status} (Expected: 403)`);
  if (userBDeleteUserABanner.status !== 403) {
    throw new Error('User B was not forbidden from deleting User A banner');
  }

  console.log('\n--- 6. Admin & Super Admin Banner Creation ---');
  const adminBannerRes = await runRequest('POST', '/api/banners', adminToken, {
    templateId,
    mainText: 'Admin Corporate Announcement'
  });
  console.log(`Admin POST /api/banners: ${adminBannerRes.status}, id: ${adminBannerRes.data?.data?.id}`);
  if (adminBannerRes.status !== 201) throw new Error('Admin failed to create banner');

  const superAdminBannerRes = await runRequest('POST', '/api/banners', superAdminToken, {
    templateId,
    mainText: 'Super Admin Festive Banner'
  });
  console.log(`Super Admin POST /api/banners: ${superAdminBannerRes.status}, id: ${superAdminBannerRes.data?.data?.id}`);
  if (superAdminBannerRes.status !== 201) throw new Error('Super Admin failed to create banner');

  console.log('\n--- 7. User A Deletes Banner ---');
  const deleteRes = await runRequest('DELETE', `/api/banners/${userABannerId}`, userAToken);
  console.log(`User A DELETE /api/banners/:id: ${deleteRes.status}`);
  if (deleteRes.status !== 200) throw new Error('User A failed to delete own banner');

  const postDeleteGet = await runRequest('GET', `/api/banners/${userABannerId}`, userAToken);
  console.log(`User A GET deleted banner: ${postDeleteGet.status} (Expected: 404)`);
  if (postDeleteGet.status !== 404) throw new Error('Deleted banner was still found');

  await mongoose.disconnect();
  console.log('\n========================================');
  console.log('FEATURE 6 VERIFICATION PASSED SUCCESSFULLY');
  console.log('========================================');
};

runFeature6Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Feature 6 verification failed:', err);
    process.exit(1);
  });
