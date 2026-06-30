/**
 * Registration script for the Campus Evaluation test server.
 * Run: node register.js
 * 
 * Fill in YOUR details below, then run the script.
 * It will print your clientID + clientSecret and patch your .env automatically.
 */

import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// 👉  FILL IN YOUR DETAILS HERE
// ─────────────────────────────────────────────────────────────
const REGISTRATION = {
  email: 'your.email@university.edu',   // ← change
  name: 'Your Full Name',              // ← change
  mobileNo: '9999999999',                 // ← change
  gitHubUsername: 'your-github-username',        // ← change
  rollNo: 'your-roll-number',            // ← change
  accessCode: 'provided-access-code',        // ← change  (given by Omkar)
};
// ─────────────────────────────────────────────────────────────

const REGISTER_URL = 'http://4.224.186.213/evaluation-service/register';
const ENV_PATH = resolve(__dirname, 'notification-app-be/.env');

async function register() {
  // Basic validation — catch obvious "still placeholder" mistakes
  const placeholders = Object.entries(REGISTRATION).filter(([, v]) =>
    v.startsWith('your') || v.startsWith('provided')
  );
  if (placeholders.length > 0) {
    console.error('\n❌  Please fill in your details in register.js before running it.');
    console.error('   Still using placeholder values for:', placeholders.map(([k]) => k).join(', '));
    process.exit(1);
  }

  console.log('\n📡  Registering with test server …');
  console.log('   URL:', REGISTER_URL);
  console.log('   Payload:', JSON.stringify(REGISTRATION, null, 2), '\n');

  let res;
  try {
    res = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(REGISTRATION),
    });
  } catch (err) {
    console.error('❌  Network error — could not reach the server.');
    console.error('   Make sure you are connected to the internet.');
    console.error('  ', err.message);
    process.exit(1);
  }

  const body = await res.text();

  if (!res.ok) {
    console.error(`❌  Server returned ${res.status} ${res.statusText}`);
    console.error('   Response:', body);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    console.error('❌  Server returned non-JSON response:', body);
    process.exit(1);
  }

  const { clientID, clientSecret } = data;

  if (!clientID || !clientSecret) {
    console.error('❌  Unexpected response — clientID or clientSecret missing.');
    console.error('   Full response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅  Registration successful!\n');
  console.log('   clientID    :', clientID);
  console.log('   clientSecret:', clientSecret);

  // ── Patch .env ────────────────────────────────────────────
  try {
    let env = readFileSync(ENV_PATH, 'utf8');
    env = env
      .replace(/^LOGGING_CLIENT_ID=.*/m, `LOGGING_CLIENT_ID=${clientID}`)
      .replace(/^LOGGING_CLIENT_SECRET=.*/m, `LOGGING_CLIENT_SECRET=${clientSecret}`);
    writeFileSync(ENV_PATH, env, 'utf8');
    console.log('\n✅  .env updated automatically →', ENV_PATH);
  } catch (err) {
    console.warn('\n⚠️   Could not auto-update .env:', err.message);
    console.log('   Add these lines to notification-app-be/.env manually:');
    console.log(`   LOGGING_CLIENT_ID=${clientID}`);
    console.log(`   LOGGING_CLIENT_SECRET=${clientSecret}`);
  }

  console.log('\n🚀  You can now start the backend:');
  console.log('   cd notification-app-be && npm run dev\n');
}

register();


// "clientID":"2b80ea00-79ef-4817-b6cc-8cd414ed279e","clientSecret":"DwyJZEKwpxGNkQGp"