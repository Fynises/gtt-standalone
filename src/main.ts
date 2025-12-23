import { RefreshingAuthProvider } from '@twurple/auth';
import { config, initializeTokens } from './config.ts';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';

const authProvider = new RefreshingAuthProvider({
  clientId: config['twitch']['auth']['client_id'],
  clientSecret: config['twitch']['auth']['client_secret'],
});

const user = await authProvider.addUserForToken(await initializeTokens());

authProvider.onRefresh(async (_userId, newToken) => {
  await Deno.writeTextFile(`twitch_tokens.json`, JSON.stringify(newToken));
});

const apiClient = new ApiClient({ authProvider });
const listener = new EventSubWsListener({ apiClient });
listener.start();

listener.onChannelRedemptionAdd(user, (e) => {
  console.log(e);
});
