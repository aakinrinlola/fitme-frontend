export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  auth: {
    mode: 'local' as 'local' | 'auth0',  //im Mode wird entschieden ob local oder auth0 genommen wird
    auth0Domain: '',
    auth0ClientId: '',
    auth0Audience: '',
  }
};
