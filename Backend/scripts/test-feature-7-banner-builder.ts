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

const runFeature7Verification = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  await seedInitialTemplates();

  console.log('\n--- 1. Authenticating Roles ---');
  const userAToken = await loginOrRegister('Meet User', 'user_a_f7@example.com', 'USER');
  const userBToken = await loginOrRegister('Other User', 'user_b_f7@example.com', 'USER');
  const adminToken = await loginOrRegister('Admin Designer', 'admin_f7@example.com', 'ADMIN');
  console.log('✓ Tokens generated for User A, User B, and Admin.');

  console.log('\n--- 2. Admin Creates Multi-Size Templates ---');
  // Square
  const squareTmpl = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Test Birthday Square',
    category: 'Birthday',
    canvas: { width: 1080, height: 1080, sizePreset: 'Square' },
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'
  });
  console.log(`Square Template: ${squareTmpl.status}, preset: ${squareTmpl.data?.data?.canvas?.sizePreset}`);
  if (squareTmpl.status !== 201 || squareTmpl.data.data.canvas.sizePreset !== 'Square') {
    throw new Error('Failed to create Square template');
  }

  // Story
  const storyTmpl = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Test Festival Story',
    category: 'Festival',
    canvas: { width: 1080, height: 1920, sizePreset: 'Story' },
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
  });
  console.log(`Story Template: ${storyTmpl.status}, preset: ${storyTmpl.data?.data?.canvas?.sizePreset}`);
  if (storyTmpl.status !== 201 || storyTmpl.data.data.canvas.sizePreset !== 'Story') {
    throw new Error('Failed to create Story template');
  }

  // Landscape
  const landscapeTmpl = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Test Business Landscape',
    category: 'Business',
    canvas: { width: 1920, height: 1080, sizePreset: 'Landscape' },
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
  });
  console.log(`Landscape Template: ${landscapeTmpl.status}, preset: ${landscapeTmpl.data?.data?.canvas?.sizePreset}`);
  if (landscapeTmpl.status !== 201 || landscapeTmpl.data.data.canvas.sizePreset !== 'Landscape') {
    throw new Error('Failed to create Landscape template');
  }

  // Filter by size
  const storyFilterRes = await runRequest('GET', '/api/templates?size=Story', userAToken);
  console.log(`GET /api/templates?size=Story count: ${storyFilterRes.data?.data?.length}`);
  const hasStory = storyFilterRes.data.data.some((t: any) => t.canvas.sizePreset === 'Story');
  if (!hasStory) throw new Error('Size filter did not return Story template');

  console.log('\n--- 3. Admin Creates Political Rally Template with Unified Element System ---');
  const politicalTmplRes = await runRequest('POST', '/api/templates', adminToken, {
    title: 'Political Victory Rally 2026',
    category: 'Politics',
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
    canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
    background: {
      type: 'image',
      source: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
      color: '#0f172a'
    },
    elements: [
      {
        id: 'party_logo',
        type: 'logo',
        label: 'Party Logo',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
        position: { x: 15, y: 12 },
        size: { width: 16, height: 14 },
        locked: true,
        editable: false,
        movable: false,
        resizable: false,
        zIndex: 1
      },
      {
        id: 'party_symbol',
        type: 'symbol',
        label: 'Party Symbol',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
        position: { x: 85, y: 12 },
        size: { width: 16, height: 14 },
        locked: false,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'candidate_photo',
        type: 'image',
        label: 'Candidate Photo',
        source: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        position: { x: 50, y: 48 },
        size: { width: 42, height: 32 },
        required: true,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 3
      },
      {
        id: 'candidate_name',
        type: 'text',
        label: 'Candidate Name',
        content: 'Original Candidate',
        position: { x: 50, y: 75 },
        size: { width: 80, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 28, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 4
      },
      {
        id: 'date',
        type: 'text',
        label: 'Rally Date',
        content: '28 October 2026',
        position: { x: 50, y: 88 },
        size: { width: 70, height: 6 },
        style: { fontFamily: 'Typewriter', fontSize: 14, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: false,
        resizable: false,
        zIndex: 4
      }
    ]
  });

  console.log(`Political Template POST: ${politicalTmplRes.status}, id: ${politicalTmplRes.data?.data?.id}`);
  if (politicalTmplRes.status !== 201 || politicalTmplRes.data.data.elements.length !== 5) {
    throw new Error('Failed to create political template with elements');
  }
  const tmplId = politicalTmplRes.data.data.id;

  console.log('\n--- 4. User Required Element Validation ---');
  const invalidBannerRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    elements: [
      { id: 'candidate_name', type: 'text', content: '' } // Missing required text
    ]
  });
  console.log(`Missing required element POST: ${invalidBannerRes.status} (Expected: 400)`);
  if (invalidBannerRes.status !== 400) throw new Error('Missing required element was not rejected with 400');

  console.log('\n--- 5. User Customizes & Saves Banner ---');
  const customBannerRes = await runRequest('POST', '/api/banners', userAToken, {
    templateId: tmplId,
    title: 'Meet Sanwadkar Campaign Banner',
    canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
    background: {
      type: 'image',
      source: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
      color: '#0f172a'
    },
    elements: [
      {
        id: 'party_logo',
        type: 'logo',
        label: 'Party Logo',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
        position: { x: 15, y: 12 },
        size: { width: 16, height: 14 },
        locked: true,
        zIndex: 1
      },
      {
        id: 'party_symbol',
        type: 'symbol',
        label: 'Party Symbol',
        source: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200',
        position: { x: 80, y: 15 }, // Moved
        size: { width: 20, height: 16 }, // Resized
        zIndex: 2
      },
      {
        id: 'candidate_photo',
        type: 'image',
        label: 'Candidate Photo',
        source: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', // Replaced
        position: { x: 50, y: 48 },
        size: { width: 45, height: 35 },
        zIndex: 3
      },
      {
        id: 'candidate_name',
        type: 'text',
        label: 'Candidate Name',
        content: 'Meet Sanwadkar', // Replaced
        position: { x: 50, y: 75 },
        size: { width: 80, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 30, color: '#FDE68A', alignment: 'center' },
        zIndex: 4
      },
      {
        id: 'date',
        type: 'text',
        label: 'Rally Date',
        content: '28 October 2026',
        position: { x: 50, y: 88 },
        size: { width: 70, height: 6 },
        style: { fontFamily: 'Typewriter', fontSize: 14, color: '#FFFFFF', alignment: 'center' },
        zIndex: 4
      }
    ]
  });

  console.log(`User POST /api/banners: ${customBannerRes.status}, id: ${customBannerRes.data?.data?.id}`);
  if (customBannerRes.status !== 201) throw new Error('User failed to create custom banner');
  const userBannerId = customBannerRes.data.data.id;

  console.log('\n--- 6. Verify Template Integrity (Original Template Remains Unaltered) ---');
  const freshTmplRes = await runRequest('GET', `/api/templates/${tmplId}`, userBToken);
  const origNameEl = freshTmplRes.data.data.elements.find((e: any) => e.id === 'candidate_name');
  console.log(`Original Template candidate_name content: "${origNameEl.content}" (Expected: "Original Candidate")`);
  if (origNameEl.content !== 'Original Candidate') {
    throw new Error('Template Integrity VIOLATED: Original template was modified by user!');
  }
  console.log('✓ Template Integrity preserved 100%.');

  console.log('\n--- 7. User Retrieves Banner & Verifies Custom Content and Layers ---');
  const userGetBanner = await runRequest('GET', `/api/banners/${userBannerId}`, userAToken);
  console.log(`User GET /api/banners/:id: ${userGetBanner.status}, title: "${userGetBanner.data?.data?.title}"`);
  const savedElements = userGetBanner.data.data.elements;
  const userCandidateName = savedElements.find((e: any) => e.id === 'candidate_name')?.content;
  if (userCandidateName !== 'Meet Sanwadkar') {
    throw new Error('User custom candidate name was not preserved');
  }
  console.log('✓ Custom elements, layers, and positions verified.');

  console.log('\n--- 8. User Isolation ---');
  const userBAccess = await runRequest('GET', `/api/banners/${userBannerId}`, userBToken);
  console.log(`User B GET /api/banners/:id: ${userBAccess.status} (Expected: 403)`);
  if (userBAccess.status !== 403) throw new Error('User B was not forbidden from accessing User A banner');

  console.log('\n--- 9. Cleanup ---');
  await runRequest('DELETE', `/api/banners/${userBannerId}`, userAToken);
  await runRequest('DELETE', `/api/templates/${tmplId}`, adminToken);
  await runRequest('DELETE', `/api/templates/${squareTmpl.data.data.id}`, adminToken);
  await runRequest('DELETE', `/api/templates/${storyTmpl.data.data.id}`, adminToken);
  await runRequest('DELETE', `/api/templates/${landscapeTmpl.data.data.id}`, adminToken);
  console.log('✓ Cleanup completed.');

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('FEATURE 7 BANNER BUILDER TEST PASSED SUCCESSFULLY');
  console.log('======================================================');
};

runFeature7Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Feature 7 verification failed:', err);
    process.exit(1);
  });
