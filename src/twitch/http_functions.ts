import ky, { HTTPError } from 'ky';
import { Type } from 'typebox';
import { Compile } from 'typebox/compile';
import { Value } from 'typebox/value';
import { AccessToken } from '@twurple/auth';

const StartDeviceAuthResponse = Type.Object({
  'device_code': Type.String(),
  'expires_in': Type.Integer(),
  'interval': Type.Integer(),
  'user_code': Type.String(),
  'verification_uri': Type.String(),
});

export async function startDeviceAuth(clientId: string) {
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('scopes', 'channel:read:redemptions channel:manage:redemptions');
  const response = await ky.post('https://id.twitch.tv/oauth2/device', { body: params });
  return Value.Parse(StartDeviceAuthResponse, await response.json());
}

const DeviceCodeFlowResponse = Type.Object({
  'access_token': Type.String(),
  'expires_in': Type.Integer(),
  'refresh_token': Type.String(),
  'scope': Type.Optional(Type.Array(Type.String())),
  'token_type': Type.Literal('bearer'),
});

const PendingAuthResponse = Compile(Type.Object({
  'status': Type.Literal(400),
  'message': Type.Literal('authorization_pending'),
}));

export async function deviceAuthFlow(
  clientId: string,
  deviceCode: string,
): Promise<AccessToken> {
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('device_code', deviceCode);
  params.set('scopes', 'channel:read:redemptions channel:manage:redemptions');
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  const response = await ky.post('https://id.twitch.tv/oauth2/token', {
    body: params,
    retry: {
      shouldRetry: async (state) => {
        if (state.error instanceof HTTPError) {
          if (state.error.response.status !== 400) return false;
          const errorBody = await state.error.response.json();
          if (PendingAuthResponse.Check(errorBody)) {
            return true;
          }
        }
        return false;
      },
      limit: 30,
      methods: ['post'],
      statusCodes: [400],
      delay: (_count) => 5_000,
    },
  });
  const validated = Value.Parse(DeviceCodeFlowResponse, await response.json());
  console.log('received tokens', validated);
  return {
    accessToken: validated['access_token'],
    refreshToken: validated['refresh_token'],
    scope: validated['scope'] ? validated['scope'] : [],
    expiresIn: validated['expires_in'],
    obtainmentTimestamp: Date.now(),
  };
}
