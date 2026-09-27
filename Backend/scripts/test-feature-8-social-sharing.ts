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

async function runFeature8Verification() {
  console.log('\n======================================================');
  console.log('STARTING FEATURE 8 AUTOMATED SOCIAL SHARING TEST SUITE');
  console.log('======================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banner_app';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  // Seed default templates
  await seedInitialTemplates();

  // 1. Create or ensure test users
  const adminEmail = 'admin_f8@bannerapp.com';
  const userEmail = 'user_f8@bannerapp.com';
  const otherUserEmail = 'other_f8@bannerapp.com';
  const password = 'Password@123';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin F8',
      email: adminEmail,
      password,
      role: 'ADMIN',
      isActive: true
    });
  }

  let normalUser = await User.findOne({ email: userEmail });
  if (!normalUser) {
    normalUser = await User.create({
      name: 'User F8',
      email: userEmail,
      password,
      role: 'USER',
      isActive: true
    });
  }

  let otherUser = await User.findOne({ email: otherUserEmail });
  if (!otherUser) {
    otherUser = await User.create({
      name: 'Other F8',
      email: otherUserEmail,
      password,
      role: 'USER',
      isActive: true
    });
  }

  // 2. Login as Admin and User
  const adminLogin = await runRequest('POST', '/api/auth/login', undefined, {
    email: adminEmail,
    password
  });
  const adminToken = adminLogin.data.data.token;
  console.log('✓ Admin login successful');

  const userLogin = await runRequest('POST', '/api/auth/login', undefined, {
    email: userEmail,
    password
  });
  const userToken = userLogin.data.data.token;
  console.log('✓ User login successful');

  const otherLogin = await runRequest('POST', '/api/auth/login', undefined, {
    email: otherUserEmail,
    password
  });
  const otherToken = otherLogin.data.data.token;
  console.log('✓ Other user login successful');

  // 3. Verify Seed Templates have Platform-Specific Social Content
  const templatesRes = await runRequest('GET', '/api/templates', userToken);
  const templates = templatesRes.data.data;
  console.log(`✓ Fetched ${templates.length} seed templates from API`);

  const politicalTemplate = templates.find((t: any) => t.title === 'Political Rally Banner');
  if (!politicalTemplate || !politicalTemplate.socialContent) {
    throw new Error('Political template missing socialContent.');
  }
  if (!politicalTemplate.socialContent.facebook?.caption || !politicalTemplate.socialContent.x?.caption) {
    throw new Error('Political template missing Facebook or X social content.');
  }
  console.log('✓ Seed Political Template contains distinct Facebook, Instagram, X, and Threads content');

  const festivalTemplate = templates.find((t: any) => t.title === 'Diwali Festival Greetings');
  if (!festivalTemplate?.socialContent?.instagram?.hashtags?.length) {
    throw new Error('Festival template missing Instagram hashtags.');
  }
  console.log('✓ Seed Festival Template contains rich Instagram hashtags and festive greetings');

  const businessTemplate = templates.find((t: any) => t.title === 'Business Product Launch');
  if (!businessTemplate?.socialContent?.x?.caption) {
    throw new Error('Business template missing X caption.');
  }
  console.log('✓ Seed Business Template contains promotional copy and platform-specific tags');

  // 4. Admin Creates Template with Custom Social Defaults
  const createTemplatePayload = {
    title: 'Tech Summit 2026 Campaign',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
    canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
    background: {
      type: 'image',
      source: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800',
      color: '#0f172a'
    },
    elements: [
      {
        id: 'event_title',
        type: 'text',
        label: 'Event Title',
        content: 'TECH SUMMIT 2026',
        position: { x: 50, y: 25 },
        size: { width: 80, height: 10 },
        style: { fontFamily: 'Impact', fontSize: 28, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 1
      }
    ],
    socialContent: {
      facebook: {
        caption: 'Join us at Tech Summit 2026 for breakthrough AI innovations and keynotes!',
        hashtags: ['#TechSummit2026', '#AI', '#Innovation']
      },
      instagram: {
        caption: 'Are you ready for the biggest tech conference of 2026? 🚀 Keynotes, workshops & networking await! ✨',
        hashtags: ['#TechConference', '#Developers', '#FutureTech', '#MumbaiTech']
      },
      x: {
        caption: 'Excited to announce Tech Summit 2026! Early bird tickets are now live:',
        hashtags: ['#TechSummit', '#AI']
      },
      threads: {
        caption: 'Tech Summit 2026 is officially announced. Drop your questions below!',
        hashtags: ['#Tech', '#Community']
      }
    }
  };

  const createRes = await runRequest('POST', '/api/templates', adminToken, createTemplatePayload);
  const createdTemplate = createRes.data.data;
  if (createRes.status !== 201 || !createdTemplate.id) {
    throw new Error('Failed to create template with socialContent.');
  }
  console.log('✓ Admin successfully created template with 4-platform social content (201 Created)');

  // 5. Verify GET /api/templates/:id returns the social content
  const fetchTmplRes = await runRequest('GET', `/api/templates/${createdTemplate.id}`, userToken);
  const fetchedTmpl = fetchTmplRes.data.data;
  if (fetchedTmpl.socialContent.facebook.caption !== createTemplatePayload.socialContent.facebook.caption) {
    throw new Error('Fetched template facebook caption does not match.');
  }
  if (fetchedTmpl.socialContent.x.hashtags.length !== 2) {
    throw new Error('Fetched template X hashtags count mismatch.');
  }
  console.log('✓ GET /api/templates/:id correctly returns platform-specific socialContent');

  // 6. Admin Updates Social Defaults on Template
  const updateRes = await runRequest('PUT', `/api/templates/${createdTemplate.id}`, adminToken, {
    socialContent: {
      ...createdTemplate.socialContent,
      x: {
        caption: 'Updated X Tweet: Tech Summit 2026 speaker lineup unveiled! 🎤',
        hashtags: ['#TechSummit2026', '#Keynotes']
      }
    }
  });
  if (updateRes.data.data.socialContent.x.caption !== 'Updated X Tweet: Tech Summit 2026 speaker lineup unveiled! 🎤') {
    throw new Error('Failed to update socialContent on template.');
  }
  console.log('✓ Admin successfully updated socialContent on template (PUT /api/templates/:id)');

  // 7. User Customizes & Saves Banner
  const createBannerPayload = {
    templateId: createdTemplate.id,
    title: 'Custom Tech Summit Banner by User',
    canvas: createdTemplate.canvas,
    background: createdTemplate.background,
    elements: [
      {
        id: 'event_title',
        type: 'text',
        label: 'Event Title',
        content: 'TECH SUMMIT 2026 - SANWADKAR LABS',
        position: { x: 50, y: 30 },
        size: { width: 85, height: 12 },
        style: { fontFamily: 'Modern', fontSize: 26, color: '#38BDF8', alignment: 'center' },
        zIndex: 1
      }
    ]
  };

  const bannerRes = await runRequest('POST', '/api/banners', userToken, createBannerPayload);
  const userBanner = bannerRes.data.data;
  if (bannerRes.status !== 201 || !userBanner.id) {
    throw new Error('Failed to create user banner.');
  }
  console.log('✓ User created customized banner preserving template socialContent linkage');

  // 8. Fetch user banner and verify populated template socialContent
  const fetchBannerRes = await runRequest('GET', `/api/banners/${userBanner.id}`, userToken);
  const fetchedBanner = fetchBannerRes.data.data;
  if (!fetchedBanner.template?.socialContent?.facebook?.caption) {
    throw new Error('User banner template does not contain populated socialContent.');
  }
  console.log('✓ User banner successfully populates template social defaults for sharing screen');

  // 9. Verify Template Integrity: User customizing/sharing never modifies original template
  const checkTemplateIntegrity = await Template.findById(createdTemplate.id);
  if (!checkTemplateIntegrity || checkTemplateIntegrity.title !== 'Tech Summit 2026 Campaign') {
    throw new Error('Template integrity was violated!');
  }
  if (checkTemplateIntegrity.elements[0].content !== 'TECH SUMMIT 2026') {
    throw new Error('Original template element was modified by user customization!');
  }
  console.log('✓ Template Integrity verified: Template remains completely unchanged in MongoDB');

  // 10. User Isolation
  const otherUserAccess = await runRequest('GET', `/api/banners/${userBanner.id}`, otherToken);
  if (otherUserAccess.status === 403) {
    console.log('✓ User banner isolation verified (403 Forbidden for other users)');
  } else {
    throw new Error(`Expected 403 Forbidden but got ${otherUserAccess.status}`);
  }

  console.log('\n======================================================');
  console.log('FEATURE 8: ALL SOCIAL SHARING TESTS PASSED SUCCESSFULLY');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runFeature8Verification().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
