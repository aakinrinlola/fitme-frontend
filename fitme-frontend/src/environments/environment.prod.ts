/**
 * PRODUKTION — vor dem Deploy echte Werte eintragen!
 *
 * apiUrl:        Railway-Backend-URL (z.B. https://fitme-api.up.railway.app)
 *                ODER eigene API-Subdomain (z.B. https://api.fitme.de)
 * auth0Domain:   Auth0 Tenant Domain (z.B. fitme.eu.auth0.com)
 * auth0ClientId: Auth0 SPA Application → Client ID
 * auth0Audience: Auth0 API → Identifier (z.B. https://fitme-api)
 */
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-BACKEND.up.railway.app',
  auth: {
    mode: 'auth0' as const,
    auth0Domain: 'YOUR_TENANT.eu.auth0.com',
    auth0ClientId: 'YOUR_AUTH0_CLIENT_ID',
    auth0Audience: 'https://fitme-api',
  }
};
