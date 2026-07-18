#!/usr/bin/env node
/**
 * Smoke-test Vocal Bridge credentials from .env.local (never prints the key).
 * Usage: node scripts/test-vocal-bridge.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) {
    console.error('Missing .env.local');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const k = trimmed.slice(0, i).trim();
    let v = trimmed.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnvLocal();
const key = env.VOCAL_BRIDGE_API_KEY || '';
const agentId = env.VOCAL_BRIDGE_AGENT_ID || '';
const base = (env.VOCAL_BRIDGE_BASE_URL || 'https://vocalbridgeai.com').replace(/\/$/, '');

console.log('Vocal Bridge smoke test');
console.log('- base:', base);
console.log('- api key set:', Boolean(key), key ? `(len ${key.length}, prefix ${key.slice(0, 3)}…)` : '');
console.log('- agent id set:', Boolean(agentId));

if (!key) {
  console.error('\nFAIL: VOCAL_BRIDGE_API_KEY is empty in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': key,
};
if (agentId) headers['X-Agent-Id'] = agentId;

const res = await fetch(`${base}/api/v1/token`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ participant_name: 'WanderWheel-SmokeTest' }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = null;
}

if (!res.ok) {
  console.error('\nFAIL: token endpoint', res.status);
  console.error(text.slice(0, 400));
  process.exit(1);
}

const hasUrl = Boolean(json?.url || json?.livekit_url);
const hasToken = Boolean(json?.token);
console.log('\nOK: token minted');
console.log('- room:', json?.room_name || '(none)');
console.log('- url present:', hasUrl);
console.log('- token present:', hasToken);
console.log('- expires_in:', json?.expires_in ?? '(none)');
console.log('- agent_mode:', json?.agent_mode ?? '(none)');

if (!hasUrl || !hasToken) {
  console.error('\nFAIL: response missing url/token fields');
  process.exit(1);
}

console.log('\nBasic Vocal Bridge auth works. Start the app and click Start Vocal Bridge.');
