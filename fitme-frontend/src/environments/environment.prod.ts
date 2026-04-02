export const environment = {
  production: true,
  apiUrl: 'https://YOUR-BACKEND.up.railway.app',
  auth: {
    mode: 'auth0' as 'local' | 'auth0',  // union → consistent with dev type
    auth0Domain: 'YOUR_TENANT.eu.auth0.com',
    auth0ClientId: 'YOUR_AUTH0_CLIENT_ID',
    auth0Audience: 'https://fitme-api',
  }
};
