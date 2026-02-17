import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConfigure = vi.fn();

vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: (...args: unknown[]) => mockConfigure(...args),
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  mockConfigure.mockClear();
});

async function importAmplify(envOverrides: Record<string, string> = {}) {
  for (const [key, val] of Object.entries(envOverrides)) {
    vi.stubEnv(key, val);
  }
  return import('@/lib/amplify');
}

describe('amplify.ts', () => {
  describe('isCognitoConfigured', () => {
    it('is true when both VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID are set', async () => {
      const { isCognitoConfigured } = await importAmplify({
        VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc',
        VITE_COGNITO_CLIENT_ID: 'client123',
      });
      expect(isCognitoConfigured).toBe(true);
    });

    it('is false when VITE_COGNITO_USER_POOL_ID is missing', async () => {
      const { isCognitoConfigured } = await importAmplify({
        VITE_COGNITO_CLIENT_ID: 'client123',
      });
      expect(isCognitoConfigured).toBe(false);
    });

    it('is false when VITE_COGNITO_CLIENT_ID is missing', async () => {
      const { isCognitoConfigured } = await importAmplify({
        VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc',
      });
      expect(isCognitoConfigured).toBe(false);
    });
  });

  describe('isSSOConfigured', () => {
    it('is true when VITE_COGNITO_DOMAIN is set', async () => {
      const { isSSOConfigured } = await importAmplify({
        VITE_COGNITO_DOMAIN: 'meliaf.auth.eu-central-1.amazoncognito.com',
      });
      expect(isSSOConfigured).toBe(true);
    });

    it('is false when VITE_COGNITO_DOMAIN is not set', async () => {
      const { isSSOConfigured } = await importAmplify({});
      expect(isSSOConfigured).toBe(false);
    });
  });

  describe('Amplify.configure()', () => {
    it('is called when both pool ID and client ID are set', async () => {
      await importAmplify({
        VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc',
        VITE_COGNITO_CLIENT_ID: 'client123',
      });
      expect(mockConfigure).toHaveBeenCalledOnce();
      expect(mockConfigure).toHaveBeenCalledWith(
        expect.objectContaining({
          Auth: expect.objectContaining({
            Cognito: expect.objectContaining({
              userPoolId: 'us-east-1_abc',
              userPoolClientId: 'client123',
            }),
          }),
        }),
      );
    });

    it('is NOT called when either env var is missing', async () => {
      await importAmplify({ VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc' });
      expect(mockConfigure).not.toHaveBeenCalled();
    });

    it('includes loginWith OAuth config when VITE_COGNITO_DOMAIN is set', async () => {
      await importAmplify({
        VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc',
        VITE_COGNITO_CLIENT_ID: 'client123',
        VITE_COGNITO_DOMAIN: 'meliaf.auth.eu-central-1.amazoncognito.com',
      });
      const config = mockConfigure.mock.calls[0][0];
      expect(config.Auth.Cognito.loginWith).toBeDefined();
      expect(config.Auth.Cognito.loginWith.oauth.domain).toBe(
        'meliaf.auth.eu-central-1.amazoncognito.com',
      );
      expect(config.Auth.Cognito.loginWith.oauth.responseType).toBe('code');
      expect(config.Auth.Cognito.loginWith.oauth.providers).toEqual([{ custom: 'AzureAD' }]);
    });

    it('omits loginWith when VITE_COGNITO_DOMAIN is not set', async () => {
      await importAmplify({
        VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc',
        VITE_COGNITO_CLIENT_ID: 'client123',
      });
      const config = mockConfigure.mock.calls[0][0];
      expect(config.Auth.Cognito.loginWith).toBeUndefined();
    });
  });
});
