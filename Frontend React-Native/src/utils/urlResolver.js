/**
 * Canonical URL resolver for LeadersKey Banner Application.
 * Guarantees single '/api' prefix and handles any combination of trailing/leading slashes.
 */
function resolveApiUrl(baseUrl, endpoint) {
  if (!baseUrl) {
    throw new Error('Base URL cannot be empty');
  }

  // Normalize base URL: remove all trailing slashes
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');

  // Normalize endpoint: remove all leading and trailing slashes
  let cleanEndpoint = (endpoint || '').trim().replace(/^\/+|\/+$/g, '');

  // Check if base URL already contains the /api prefix at its end
  const baseHasApi = cleanBase.endsWith('/api');

  // Check if endpoint begins with api/
  const endpointHasApi = cleanEndpoint.startsWith('api/') || cleanEndpoint === 'api';

  if (baseHasApi && endpointHasApi) {
    // Strip the redundant api/ from the endpoint
    cleanEndpoint = cleanEndpoint.replace(/^api\/?/, '');
  } else if (!baseHasApi && !endpointHasApi) {
    // Neither has /api, so prepend api/ to endpoint
    cleanEndpoint = cleanEndpoint ? `api/${cleanEndpoint}` : 'api';
  }

  return cleanEndpoint ? `${cleanBase}/${cleanEndpoint}` : cleanBase;
}

module.exports = { resolveApiUrl };
