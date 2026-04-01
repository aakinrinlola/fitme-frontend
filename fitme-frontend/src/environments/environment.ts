export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  auth: {
    mode: 'local' as const,           // 'local' = eigene JWT-Auth
    auth0Domain: '',
    auth0ClientId: '',
    auth0Audience: '',
  }
};
