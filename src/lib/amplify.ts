import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN; // e.g. "meliaf-dev.auth.eu-central-1.amazoncognito.com"

if (userPoolId && userPoolClientId) {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        ...(cognitoDomain && {
          loginWith: {
            oauth: {
              domain: cognitoDomain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [currentOrigin],
              redirectSignOut: [currentOrigin],
              responseType: 'code',
              providers: [{ custom: 'AzureAD' }],
            },
          },
        }),
      },
    },
  });
}

export const isCognitoConfigured = Boolean(userPoolId && userPoolClientId);
export const isSSOConfigured = Boolean(cognitoDomain);
