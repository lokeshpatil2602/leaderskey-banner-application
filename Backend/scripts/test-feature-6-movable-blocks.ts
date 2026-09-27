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

const runMovableBlocksVerification = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  await seedInitialTemplates();

  console.log('\n--- 1. Authenticating Roles ---');
  const userAToken = await loginOrRegister('Meet User', 'meet_movable_f6@example.com', 'USER');
  const userBToken = await loginOrRegister('Other User', 'other_movable_f6@example.com', 'USER');
  const adminToken = await loginOrRegister('Admin User', 'admin_movable_f6@example.com', 'ADMIN');
  console.log('✓ Tokens generated for User A, User B, and Admin.');

  console.log('\n--- 2. Admin Creates Template with Movable & Fixed Position Blocks ---');
  const createTmplRes = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Festival Banner Movable Test',
    category: 'Festival',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    editableFields: [
      {
        id: 'heading',
        label: 'Heading',
        type: 'text',
        required: true,
        movable: true,
        defaultStyle: { fontFamily: 'Modern', fontSize: 28, color: '#FFFFFF', alignment: 'center' },
        defaultPosition: { x: 50, y: 18 }
      },
      {
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        movable: true,
        defaultStyle: { fontFamily: 'Impact', fontSize: 22, color: '#FDE68A', alignment: 'center' },
        defaultPosition: { x: 50, y: 50 }
      },
      {
        id: 'date',
        label: 'Date',
        type: 'text',
        required: false,
        movable: true,
        defaultStyle: { fontFamily: 'Classic', fontSize: 16, color: '#F3F4F6', alignment: 'center' },
        defaultPosition: { x: 50, y: 80 }
      },
      {
        id: 'notice',
        label: 'Important Notice',
        type: 'text',
        required: false,
        movable: false,
        defaultStyle: { fontFamily: 'Typewriter', fontSize: 12, color: '#E2E8F0', alignment: 'center' },
        defaultPosition: { x: 50, y: 92 }
      }
    ]
  });

  console.log(`Admin POST /api/templates: ${createTmplRes.status}, id: ${createTmplRes.data?.data?.id}`);
  if (createTmplRes.status !== 201) throw new Error('Admin failed to create template with movable blocks');
  const tmplId = createTmplRes.data.data.id;

  console.log('\n--- 3. Admin Modifies Template Default Position ---');
  const updateTmplRes = await runRequest('PUT', `/api/templates/${tmplId}`, adminToken, {
    editableFields: createTmplRes.data.data.editableFields.map((f: any) =>
      f.id === 'heading' ? { ...f, defaultPosition: { x: 50, y: 15 } } : f
    )
  });
  console.log(`Admin PUT /api/templates/:id: ${updateTmplRes.status}`);
  if (updateTmplRes.status !== 200) throw new Error('Admin failed to update template');

  console.log('\n--- 4. User Validation (Required Field Check) ---');
  const invalidSaveRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    fields: [
      { fieldId: 'heading', label: 'Heading', value: 'HAPPY FESTIVAL' },
      { fieldId: 'name', label: 'Name', value: '' } // Missing required name
    ]
  });
  console.log(`Missing required field POST status: ${invalidSaveRes.status} (Expected: 400)`);
  if (invalidSaveRes.status !== 400) throw new Error('Backend failed to validate required field');

  console.log('\n--- 5. User Moves Blocks & Saves Banner with Custom Percentage Coordinates ---');
  const saveBannerRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    fields: [
      {
        fieldId: 'heading',
        label: 'Heading',
        value: 'HAPPY DIWALI',
        style: { fontFamily: 'Modern', fontSize: 30, color: '#FFFFFF', alignment: 'center' },
        position: { x: 50, y: 15 } // Top Center
      },
      {
        fieldId: 'name',
        label: 'Name',
        value: 'Meet Patel',
        style: { fontFamily: 'Impact', fontSize: 24, color: '#FDE68A', alignment: 'center' },
        position: { x: 25, y: 50 } // Moved to Middle-Left
      },
      {
        fieldId: 'date',
        label: 'Date',
        value: '28 October 2026',
        style: { fontFamily: 'Classic', fontSize: 16, color: '#F3F4F6', alignment: 'center' },
        position: { x: 75, y: 80 } // Moved to Bottom-Right
      },
      {
        fieldId: 'notice',
        label: 'Important Notice',
        value: 'Entry by Ticket Only',
        style: { fontFamily: 'Typewriter', fontSize: 12, color: '#E2E8F0', alignment: 'center' },
        position: { x: 50, y: 92 } // Fixed at Bottom
      }
    ]
  });

  console.log(`User POST /api/banners: ${saveBannerRes.status}, id: ${saveBannerRes.data?.data?.id}`);
  if (saveBannerRes.status !== 201) throw new Error('User failed to save banner with movable positions');
  const bannerId = saveBannerRes.data.data.id;

  console.log('\n--- 6. User Retrieves Banner & Verifies Exact Saved Positions ---');
  const userBannersRes = await runRequest('GET', `/api/banners/${bannerId}`, userAToken);
  console.log(`User GET /api/banners/:id: ${userBannersRes.status}`);
  const saved = userBannersRes.data.data;
  if (!saved || saved.fields.length !== 4) throw new Error('Saved banner fields missing');

  const nameField = saved.fields.find((f: any) => f.fieldId === 'name');
  const dateField = saved.fields.find((f: any) => f.fieldId === 'date');

  console.log(`Name position: x=${nameField.position.x}%, y=${nameField.position.y}% (Expected: x=25, y=50)`);
  console.log(`Date position: x=${dateField.position.x}%, y=${dateField.position.y}% (Expected: x=75, y=80)`);

  if (nameField.position.x !== 25 || nameField.position.y !== 50) {
    throw new Error('Name field position was not persisted correctly');
  }
  if (dateField.position.x !== 75 || dateField.position.y !== 80) {
    throw new Error('Date field position was not persisted correctly');
  }

  console.log('\n--- 7. User Isolation Verification ---');
  const userBAccess = await runRequest('GET', `/api/banners/${bannerId}`, userBToken);
  console.log(`User B GET User A's banner: ${userBAccess.status} (Expected: 403)`);
  if (userBAccess.status !== 403) throw new Error('User B was not blocked from accessing User A banner');

  console.log('\n--- 8. Cleanup ---');
  await runRequest('DELETE', `/api/banners/${bannerId}`, userAToken);
  await runRequest('DELETE', `/api/templates/${tmplId}`, adminToken);
  console.log('✓ Cleanup completed.');

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('FEATURE 6 MOVABLE TEXT BLOCKS TEST PASSED SUCCESSFULLY');
  console.log('======================================================');
};

runMovableBlocksVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Movable blocks test failed:', err);
    process.exit(1);
  });
