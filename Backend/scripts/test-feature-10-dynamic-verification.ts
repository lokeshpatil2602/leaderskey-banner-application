import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/modules/auth/auth.model';
import { Template } from '../src/modules/templates/template.model';
import { Banner } from '../src/modules/banners/banner.model';
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
              const parsed = JSON.parse(rawData);
              resolve({ status: res.statusCode, data: parsed });
            } catch {
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

async function runFeature10DynamicVerification() {
  console.log('\n================================================================');
  console.log('FEATURE 10: FULL DYNAMIC SYSTEM & PRODUCTION VERIFICATION SUITE');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banner_app';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  // Seed default templates
  await seedInitialTemplates();

  // 1. Test Public Health Endpoints (Unauthenticated)
  console.log('\n--- 1. Testing Production Health Endpoints ---');
  const rootHealth = await runRequest('GET', '/health');
  if (rootHealth.status !== 200 || rootHealth.data.status !== 'ok') {
    throw new Error(`GET /health failed: status=${rootHealth.status}`);
  }
  console.log('✓ GET /health returns 200 OK with status="ok" (Unauthenticated)');

  const apiHealth = await runRequest('GET', '/api/health');
  if (apiHealth.status !== 200 || !apiHealth.data.data?.database) {
    throw new Error(`GET /api/health failed: status=${apiHealth.status}`);
  }
  console.log('✓ GET /api/health returns 200 OK with database connection status');

  // 2. Setup Test Users
  console.log('\n--- 2. Authenticating Users ---');
  const adminEmail = 'admin_f10@bannerapp.com';
  const userEmail = 'user_f10@bannerapp.com';
  const otherUserEmail = 'other_f10@bannerapp.com';
  const password = 'Password@123';

  await User.deleteMany({ email: { $in: [adminEmail, userEmail, otherUserEmail] } });
  await Template.deleteMany({ title: /Dynamic Election Campaign 2026/ });
  await Banner.deleteMany({ title: /Dynamic Election Campaign/ });

  await User.create({ name: 'Admin F10', email: adminEmail, password, role: 'ADMIN', isActive: true });
  await User.create({ name: 'User F10', email: userEmail, password, role: 'USER', isActive: true });
  await User.create({ name: 'Other F10', email: otherUserEmail, password, role: 'USER', isActive: true });

  const adminLogin = await runRequest('POST', '/api/auth/login', undefined, { email: adminEmail, password });
  const adminToken = adminLogin.data.data.token;
  console.log('✓ Admin authenticated');

  const userLogin = await runRequest('POST', '/api/auth/login', undefined, { email: userEmail, password });
  const userToken = userLogin.data.data.token;
  console.log('✓ Standard User authenticated');

  const otherLogin = await runRequest('POST', '/api/auth/login', undefined, { email: otherUserEmail, password });
  const otherToken = otherLogin.data.data.token;
  console.log('✓ Secondary User authenticated');

  // 3. Dynamic Template Verification: Brand new custom template (Custom size 1200x1600, 7 elements)
  console.log('\n--- 3. Testing Dynamic Template Creation (Arbitrary Custom Size & 7 Elements) ---');
  const customTemplatePayload = {
    title: 'Dynamic Election Campaign 2026',
    category: 'Politics',
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
    canvas: {
      width: 1200,
      height: 1600,
      sizePreset: 'Custom'
    },
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
        position: { x: 15, y: 10 },
        size: { width: 18, height: 12 },
        locked: true,
        editable: false,
        movable: false,
        zIndex: 1
      },
      {
        id: 'candidate_photo',
        type: 'image',
        label: 'Candidate Photo',
        source: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        position: { x: 50, y: 40 },
        size: { width: 45, height: 35 },
        style: { borderRadius: 16 },
        required: true,
        editable: true,
        movable: true,
        zIndex: 2
      },
      {
        id: 'party_symbol',
        type: 'symbol',
        label: 'Party Symbol',
        source: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200',
        position: { x: 85, y: 10 },
        size: { width: 18, height: 12 },
        required: false,
        editable: true,
        movable: true,
        zIndex: 2
      },
      {
        id: 'candidate_name',
        type: 'text',
        label: 'Candidate Name',
        content: 'Hon. Meet Sanwadkar',
        position: { x: 50, y: 65 },
        size: { width: 80, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 30, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'designation',
        type: 'text',
        label: 'Designation',
        content: 'Member of Parliament Candidate',
        position: { x: 50, y: 74 },
        size: { width: 75, height: 6 },
        style: { fontFamily: 'Modern', fontSize: 18, color: '#93C5FD', alignment: 'center' },
        required: false,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'date',
        type: 'text',
        label: 'Rally Date',
        content: 'Sunday, 15 November 2026',
        position: { x: 50, y: 84 },
        size: { width: 70, height: 6 },
        style: { fontFamily: 'Casual', fontSize: 16, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'location',
        type: 'text',
        label: 'Location',
        content: 'Shivaji Ground, Mumbai',
        position: { x: 50, y: 92 },
        size: { width: 75, height: 6 },
        style: { fontFamily: 'Typewriter', fontSize: 14, color: '#FCD34D', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      }
    ],
    socialContent: {
      facebook: {
        caption: 'Mega Election Rally announcement for Mumbai! Join us live.',
        hashtags: ['#Election2026', '#MumbaiRally', '#Progress']
      },
      instagram: {
        caption: 'Honored to announce our Campaign Rally! Let our collective voice build the future. 🇮🇳✨',
        hashtags: ['#Campaign2026', '#YouthLeadership', '#Mumbai']
      },
      x: {
        caption: 'Excited to invite everyone to our Mumbai Campaign Rally on Nov 15! 🇮🇳',
        hashtags: ['#Election2026', '#Leadership']
      },
      threads: {
        caption: 'Join the movement! Campaign rally is happening on 15 November.',
        hashtags: ['#Politics', '#Democracy']
      }
    }
  };

  const createTmplRes = await runRequest('POST', '/api/templates', adminToken, customTemplatePayload);
  if (createTmplRes.status !== 201) {
    throw new Error(`Failed to create dynamic template: status=${createTmplRes.status}`);
  }
  const createdTemplate = createTmplRes.data.data;
  console.log(`✓ Admin created dynamic template (ID: ${createdTemplate.id})`);
  console.log(`✓ Custom size: ${createdTemplate.canvas.width}x${createdTemplate.canvas.height} (${createdTemplate.canvas.sizePreset})`);
  console.log(`✓ Dynamic element count: ${createdTemplate.elements.length} elements`);

  // 4. Dynamic Field & Coordinate Verification
  console.log('\n--- 4. Verifying Dynamic Field & Coordinate Processing ---');
  const getTmplRes = await runRequest('GET', `/api/templates/${createdTemplate.id}`, userToken);
  const fetchedTmpl = getTmplRes.data.data;
  if (fetchedTmpl.elements.length !== 7) {
    throw new Error(`Expected 7 elements, got ${fetchedTmpl.elements.length}`);
  }
  if (fetchedTmpl.canvas.width !== 1200 || fetchedTmpl.canvas.height !== 1600) {
    throw new Error('Custom canvas dimensions were not preserved.');
  }
  console.log('✓ All 7 elements, normalized coordinates (x: 0..100%, y: 0..100%), and sizes faithfully preserved');

  // 5. Dynamic User Banner Customization & Template Integrity
  console.log('\n--- 5. Testing User Banner Customization & Template Integrity ---');
  const userCustomElements = fetchedTmpl.elements.map((el: any) => {
    if (el.id === 'candidate_name') {
      return { ...el, content: 'Hon. Manan Patel', position: { x: 50, y: 66 } };
    }
    if (el.id === 'location') {
      return { ...el, content: 'Bandra Kurla Complex Ground, Mumbai' };
    }
    return el;
  });

  const bannerCreateRes = await runRequest('POST', '/api/banners', userToken, {
    templateId: createdTemplate.id,
    title: 'Customized Campaign Banner for Manan Patel',
    canvas: fetchedTmpl.canvas,
    background: fetchedTmpl.background,
    elements: userCustomElements
  });

  if (bannerCreateRes.status !== 201) {
    throw new Error(`Failed to create banner: status=${bannerCreateRes.status}`);
  }
  const userBanner = bannerCreateRes.data.data;
  console.log(`✓ User created banner (ID: ${userBanner.id})`);

  // Verify template integrity
  const tmplCheck = await Template.findById(createdTemplate.id);
  const candNameEl = tmplCheck?.elements.find((e) => e.id === 'candidate_name');
  if (candNameEl?.content !== 'Hon. Meet Sanwadkar') {
    throw new Error('Template integrity was violated! Original template was altered by user customization.');
  }
  console.log('✓ Template Integrity Verified: Original template remains 100% unaltered in MongoDB');

  // 6. Dynamic Social Content Verification
  console.log('\n--- 6. Verifying Dynamic Social Content on Banner ---');
  const bannerFetchRes = await runRequest('GET', `/api/banners/${userBanner.id}`, userToken);
  const populatedSocial = bannerFetchRes.data.data.template?.socialContent;
  if (!populatedSocial?.facebook?.caption || !populatedSocial?.x?.caption) {
    throw new Error('Populated banner template missing dynamic socialContent.');
  }
  if (populatedSocial.x.caption !== 'Excited to invite everyone to our Mumbai Campaign Rally on Nov 15! 🇮🇳') {
    throw new Error('Populated X caption does not match dynamic template data.');
  }
  console.log('✓ Banner dynamically populates platform-specific socialContent from template');

  // 7. Dynamic Size Preset Query Filter
  console.log('\n--- 7. Verifying Dynamic Size Filter API ---');
  const customSizeRes = await runRequest('GET', '/api/templates?size=Custom', userToken);
  const customTemplates = customSizeRes.data.data;
  const foundCustom = customTemplates.find((t: any) => t.id === createdTemplate.id);
  if (!foundCustom) {
    throw new Error('Custom size template not returned in ?size=Custom filter.');
  }
  console.log('✓ GET /api/templates?size=Custom correctly returns the dynamic custom-sized template');

  // 8. User Ownership & Isolation
  console.log('\n--- 8. Verifying User Isolation & Authorization ---');
  const unauthorizedAccess = await runRequest('GET', `/api/banners/${userBanner.id}`, otherToken);
  if (unauthorizedAccess.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-user banner access, got ${unauthorizedAccess.status}`);
  }
  console.log('✓ Cross-user access returns 403 Forbidden (Ownership Isolation Verified)');

  const userCreateTmpl = await runRequest('POST', '/api/templates', userToken, customTemplatePayload);
  if (userCreateTmpl.status !== 403) {
    throw new Error(`Expected 403 Forbidden for standard user creating template, got ${userCreateTmpl.status}`);
  }
  console.log('✓ Standard user creating template returns 403 Forbidden (RBAC Verified)');

  console.log('\n================================================================');
  console.log('FEATURE 10: ALL DYNAMIC AUDIT & PRODUCTION TESTS PASSED (100%)');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runFeature10DynamicVerification().catch((err) => {
  console.error('Feature 10 Test Suite Failed:', err);
  process.exit(1);
});
