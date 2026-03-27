import { Type } from 'typebox';
import { Compile } from 'typebox/compile';
import { parse } from '@std/yaml';
import open from 'open';
import { AccessToken } from '@twurple/auth';
import { deviceAuthFlow, startDeviceAuth } from './twitch/http_functions.ts';

export const Config = Type.Object({
  'twitch': Type.Object({
    'channel': Type.String(),
    'auth': Type.Object({
      'client_id': Type.String(),
      'client_secret': Type.String(),
    }),
  }),
  'osc': Type.Object({
    'port': Type.Number(),
    'device_ip': Type.String(),
  }),
  'triggers': Type.Array(Type.Object({
    'redemption_id': Type.String(),
    'duration': Type.Number(),
    'strength': Type.Number(),
  })),
});
export type Config = Type.Static<typeof Config>;

const configString = Deno.readTextFileSync('config.yaml');

export const config = Compile(Config).Parse(parse(configString));

export async function initializeTokens(): Promise<AccessToken> {
  const clientId = config['twitch']['auth']['client_id'];
  try {
    return JSON.parse(await Deno.readTextFile('twitch_tokens.json'));
  } catch (_e: unknown) {
    const params = await startDeviceAuth(clientId);
    await open(params['verification_uri']);
    const tokens = await deviceAuthFlow(clientId, params['device_code']);
    await Deno.writeTextFile('twitch_tokens.json', JSON.stringify(tokens));
    return tokens;
  }
}
