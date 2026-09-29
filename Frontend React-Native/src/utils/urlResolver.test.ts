import { resolveApiUrl } from './urlResolver';

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`[FAILED] ${label}: Expected "${expected}", but got "${actual}"`);
  }
  console.log(`[PASS] ${label} => ${actual}`);
}

export function testUrlResolver() {
  console.log('=== RUNNING URL RESOLVER UNIT TESTS ===');

  const BASE_WITH_API = 'https://leaderskey-banner-application.onrender.com/api';
  const BASE_WITHOUT_API = 'https://leaderskey-banner-application.onrender.com';

  // 1. BASE WITH /api + relative endpoint
  assertEqual(
    resolveApiUrl(BASE_WITH_API, 'upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(/api) + "upload"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITH_API, '/upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(/api) + "/upload"'
  );

  // 2. BASE WITH /api + redundant /api/upload (Prevents /api/api/ bug)
  assertEqual(
    resolveApiUrl(BASE_WITH_API, '/api/upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(/api) + "/api/upload"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITH_API, 'api/upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(/api) + "api/upload"'
  );

  // 3. BASE WITHOUT /api + relative endpoint
  assertEqual(
    resolveApiUrl(BASE_WITHOUT_API, 'upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(root) + "upload"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITHOUT_API, '/upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(root) + "/upload"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITHOUT_API, '/api/upload'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'base(root) + "/api/upload"'
  );

  // 4. Standard endpoints
  assertEqual(
    resolveApiUrl(BASE_WITH_API, '/auth/login'),
    'https://leaderskey-banner-application.onrender.com/api/auth/login',
    'base(/api) + "/auth/login"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITH_API, '/templates?category=festive'),
    'https://leaderskey-banner-application.onrender.com/api/templates?category=festive',
    'base(/api) + "/templates?category=festive"'
  );
  assertEqual(
    resolveApiUrl(BASE_WITH_API, '/banners/12345'),
    'https://leaderskey-banner-application.onrender.com/api/banners/12345',
    'base(/api) + "/banners/12345"'
  );

  // 5. Trailing slash on base
  assertEqual(
    resolveApiUrl('https://leaderskey-banner-application.onrender.com/api/', '/upload/'),
    'https://leaderskey-banner-application.onrender.com/api/upload',
    'trailing slashes stripped'
  );

  console.log('All URL resolver unit tests passed successfully!\n');
}

testUrlResolver();
