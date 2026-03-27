# giggletech twitch standalone

## building

Requires [Deno](https://deno.com/) to be installed.

**Linux:**

```sh
deno compile --allow-net --allow-read --allow-write --output gtt-standalone ./src/main.ts
```

**Windows** (cross-compile from Linux, or run natively on Windows):

```sh
deno compile --target x86_64-pc-windows-msvc --allow-net --allow-read --allow-write --output gtt-standalone ./src/main.ts
```

This will produce `gtt-standalone` (Linux) or `gtt-standalone.exe` (Windows).

## how to use

### Twitch Setup

Firstly you will need to create API tokens for this app.

Log into: [the twitch developer console](https://dev.twitch.tv/)

Then press the `Register Your Application` Button on the top left.

- Name: Could be named anything
- OAuth Redirect URLs: for this use-case, not important, set it to `https://localhost:3000/callback` as a placeholder
- Category: Not important, set it to `Game Integration`
- Client Type: `Confidendial`

You should be presented with a `Client ID` and a `Client Secret`.

`Client Secret` should be noted down as it won't be shown again unless if you regenerate a new one.

### App Setup

#### configuration

In the same directory as the executable (`.exe`) create a new file named `config.yaml`.

In this file, firstly configure your Twitch API and OSC:

```yaml
twitch:
  channel: channel_name
  auth:
    client_id: replace_with_your_client_id
    client_secret: replace_with_your_client_secret
osc:
  port: 9001
  device_ip: "127.0.0.1"
triggers: [] # this is where your redemption config would go, a placeholder for now
```

`channel` needs to be the same as what you log in to twitch with.
Which can also be found at the end of your channel URL.

`osc` configuration should be the same as the original giggletech config.

#### Authenticating

After filling out the required configuration, start the application.

First time running will begin twitch authentication using the [device code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow).

A browser window should open with a pre-filled code. follow the instructions in the browser.

Once authentication completes, a file named `twitch_tokens.json` should be created in the same directory as the executable.

#### Finding the redemption id

The app will output all channel redemption IDs to the console. to find the redemption ID required for activating the haptic device. run the redemption in your channel while the application is running.
then note the ID down.

Then. in `config.yaml` make the following edits:

```yaml
triggers:
  - redemption_id: 04c7f8c5-5bc3-4e4b-a263-29891e2e89b1
    duration: 3  # duration of the haptic trigger in seconds
    strength: 30 # strength of the haptic, similar to the original giggletech config.
```
