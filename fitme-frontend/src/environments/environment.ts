export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  auth: {
    mode: 'local' as 'local' | 'auth0',  // union → TS2367 resolved
    auth0Domain: '',
    auth0ClientId: '',
    auth0Audience: '',
  }
};
