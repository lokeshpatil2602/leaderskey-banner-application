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

const runDynamicEditorVerification = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  await seedInitialTemplates();

  console.log('\n--- 1. Authenticating Roles ---');
  const userAToken = await loginOrRegister('Meet User', 'meet_user_f6@example.com', 'USER');
  const userBToken = await loginOrRegister('Other User', 'other_user_f6@example.com', 'USER');
  const adminToken = await loginOrRegister('Admin User', 'admin_dynamic_f6@example.com', 'ADMIN');
  console.log('✓ Tokens generated for User A, User B, and Admin.');

  console.log('\n--- 2. Admin Creates Template with Dynamic Fields ---');
  const createTmplRes = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Custom Birthday Template',
    category: 'Birthday',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    editableFields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'age', label: 'Age', type: 'text', required: true },
      { id: 'message', label: 'Message', type: 'text', required: false }
    ]
  });

  console.log(`Admin POST /api/templates: ${createTmplRes.status}, id: ${createTmplRes.data?.data?.id}`);
  if (createTmplRes.status !== 201 || !createTmplRes.data?.data?.editableFields?.length) {
    throw new Error('Admin failed to create template with dynamic editableFields');
  }
  const tmplId = createTmplRes.data.data.id;

  console.log('\n--- 3. Admin Updates Template Dynamic Fields ---');
  const updateTmplRes = await runRequest('PUT', `/api/templates/${tmplId}`, adminToken, {
    editableFields: [
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'age', label: 'Age', type: 'text', required: true },
      { id: 'message', label: 'Message', type: 'text', required: false },
      { id: 'location', label: 'Location', type: 'text', required: false }
    ]
  });
  console.log(`Admin PUT /api/templates/:id: ${updateTmplRes.status}, fields count: ${updateTmplRes.data?.data?.editableFields?.length}`);
  if (updateTmplRes.status !== 200 || updateTmplRes.data.data.editableFields.length !== 4) {
    throw new Error('Admin failed to update template editableFields');
  }

  console.log('\n--- 4. User Dynamic Form Validation (Missing Required Field) ---');
  const missingFieldRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    fields: [
      { fieldId: 'name', label: 'Name', value: 'Meet' },
      { fieldId: 'age', label: 'Age', value: '   ' } // Empty required field
    ]
  });
  console.log(`Missing required field POST status: ${missingFieldRes.status} (Expected: 400)`);
  if (missingFieldRes.status !== 400) {
    throw new Error('Backend did not reject banner with missing required field');
  }

  console.log('\n--- 5. User Saves Dynamic Banner with Custom Styling ---');
  const saveBannerRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    fields: [
      {
        fieldId: 'name',
        label: 'Name',
        value: 'Meet',
        style: { fontFamily: 'Poppins', fontSize: 32, color: '#FFFFFF', alignment: 'center' }
      },
      {
        fieldId: 'age',
        label: 'Age',
        value: '21',
        style: { fontFamily: 'Inter', fontSize: 20, color: '#FCD34D', alignment: 'center' }
      },
      {
        fieldId: 'message',
        label: 'Message',
        value: 'Happy Birthday!',
        style: { fontFamily: 'Inter', fontSize: 16, color: '#F3F4F6', alignment: 'center' }
      }
    ]
  });
  console.log(`User POST /api/banners: ${saveBannerRes.status}, id: ${saveBannerRes.data?.data?.id}`);
  if (saveBannerRes.status !== 201) throw new Error('User failed to save dynamic banner');
  const userBannerId = saveBannerRes.data.data.id;

  console.log('\n--- 6. User Retrieves Banner List with Populated Template & Styles ---');
  const userBannersRes = await runRequest('GET', '/api/banners', userAToken);
  console.log(`User GET /api/banners count: ${userBannersRes.data?.data?.length}`);
  const savedBanner = userBannersRes.data?.data?.find((b: any) => b.id === userBannerId);
  if (!savedBanner || savedBanner.fields?.length !== 3) {
    throw new Error('Saved banner fields were not retrieved properly');
  }
  console.log(`✓ Retrieved banner with fields: ${savedBanner.fields.map((f: any) => `${f.label}=${f.value} (${f.style.color})`).join(', ')}`);

  console.log('\n--- 7. User Isolation Verification ---');
  const userBList = await runRequest('GET', '/api/banners', userBToken);
  const userBSeesBanner = userBList.data?.data?.some((b: any) => b.id === userBannerId);
  if (userBSeesBanner) throw new Error('User B unexpectedly saw User A dynamic banner!');

  const userBAccess = await runRequest('GET', `/api/banners/${userBannerId}`, userBToken);
  console.log(`User B GET /api/banners/:id: ${userBAccess.status} (Expected: 403)`);
  if (userBAccess.status !== 403) throw new Error('User B was not forbidden from accessing User A banner');

  console.log('\n--- 8. Cleanup ---');
  await runRequest('DELETE', `/api/banners/${userBannerId}`, userAToken);
  await runRequest('DELETE', `/api/templates/${tmplId}`, adminToken);
  console.log('✓ Cleanup completed.');

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('FEATURE 6 DYNAMIC TEMPLATE BANNER EDITOR TEST PASSED');
  console.log('======================================================');
};

runDynamicEditorVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Dynamic editor test failed:', err);
    process.exit(1);
  });
