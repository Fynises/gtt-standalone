import { RefreshingAuthProvider } from '@twurple/auth';
import { config, initializeTokens } from './config.ts';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import osc from 'osc';

const authProvider = new RefreshingAuthProvider({
  clientId: config['twitch']['auth']['client_id'],
  clientSecret: config['twitch']['auth']['client_secret'],
});

// engage twitch listener

const user = await authProvider.addUserForToken(await initializeTokens());

authProvider.onRefresh(async (_userId, newToken) => {
  await Deno.writeTextFile(`twitch_tokens.json`, JSON.stringify(newToken));
});

const apiClient = new ApiClient({ authProvider });
const listener = new EventSubWsListener({ apiClient });
listener.start();

// start OSC

const oscPort = new osc.UDPPort({
  localAddress: config['osc']['device_ip'],
  localPort: config['osc']['port'],
});

oscPort.open();

oscPort.on('ready', () => {
  console.log('OSC ready');
});

// deno-lint-ignore no-explicit-any
oscPort.on('error', (e: any) => {
  console.error('error occurred in OSC', e);
});

// convert the triggers array to a map
const triggers = new Map(config['triggers'].map((t) => [t.redemption_id, t]));

listener.onChannelRedemptionAdd(user, (e) => {
  console.log(`received redemption, id: ${e.id}`);
  const trigger = triggers.get(e.id);
  if (trigger === undefined) return;
  const handle = setInterval(() => {
    oscPort.send({
      address: config['osc']['device_ip'],
      args: [
        {
          type: 'i',
          value: trigger['strength'],
        },
      ],
    });
  }, 500);
  setTimeout(() => {
    clearInterval(handle);
  }, trigger['duration'] * 1000);
  for (let i = 0; i < 3; i++) {
    oscPort.send({
      address: config['osc']['device_ip'],
      args: [
        {
          type: 'i',
          value: 0,
        },
      ],
    });
  }
});
