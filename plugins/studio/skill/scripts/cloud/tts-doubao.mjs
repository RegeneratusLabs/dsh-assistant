#!/usr/bin/env node
/**
 * tts-doubao.mjs · Doubao speech TTS (Volcengine openspeech)
 *
 * ⚠️ Optional cloud capability: this script sends the text to be voiced to ByteDance's
 * official TTS endpoint (openspeech.bytedance.com) using your own key; the endpoint is
 * validated against a strict domain allowlist. The first call needs --yes or an explicit
 * STUDIO_CLOUD_OK=1 confirmation. See SECURITY.md at the repo root for the data-flow
 * statement.
 *
 * Usage:
 *   node scripts/cloud/tts-doubao.mjs --text "Hello" --out demo.mp3 --yes
 *   node scripts/cloud/tts-doubao.mjs --text-file script.txt --out out.mp3 --speed 1.0 --yes
 *   node scripts/cloud/tts-doubao.mjs --text "Hello" --out demo.mp3 --timestamps --yes   # with word-level timestamps
 *
 * Output:
 *   - the mp3 file is written to the --out path
 *   - stdout prints one line of JSON: {"path":"...","duration":12.34,"bytes":54321}
 *   - with --timestamps it additionally contains words: [{text,start,end,confidence}] (seconds, relative to the start of this audio)
 *     note: the timestamp text is the post-TN (text-normalised) text, so numbers are spelled
 *     out (e.g. "2025" is read out digit by digit), and punctuation attaches to the preceding
 *     character; this needs a 2.0 resource (seed-tts-2.0 / seed-icl-2.0), Chinese and English only.
 *
 * Dependencies: Node 18+ (built-in fetch/crypto), ffprobe (to measure the duration, brew install ffmpeg)
 *
 * env (read automatically from .env in the skill root, overridable via process.env):
 *   DOUBAO_TTS_API_KEY     optional (newer API Key auth)
 *   DOUBAO_APP_ID          optional (console App ID, paired with DOUBAO_ACCESS_KEY)
 *   DOUBAO_ACCESS_KEY      optional (console Access Token, paired with DOUBAO_APP_ID)
 *   DOUBAO_TTS_VOICE_ID    required (voice id)
 *   DOUBAO_TTS_RESOURCE_ID optional (inferred from the voice id by default)
 *   DOUBAO_TTS_ENDPOINT    default https://openspeech.bytedance.com/api/v3/tts/unidirectional
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, '..', '..');

function loadEnv() {
  const envPath = path.join(SKILL_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

function parseArgs(argv) {
  const args = { speed: '1.0', encoding: 'mp3' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--text') args.text = argv[++i];
    else if (a === '--text-file') args.textFile = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--speed') args.speed = argv[++i];
    else if (a === '--voice') args.voice = argv[++i];
    else if (a === '--encoding') args.encoding = argv[++i];
    else if (a === '--timestamps') args.timestamps = true;
    else if (a === '--yes') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function usage() {
  console.error(`
tts-doubao.mjs · Doubao speech TTS

  --text <str>          text to synthesize
  --text-file <path>    read the text from a file (either this or --text)
  --out <path>          output mp3 path (required)
  --speed <float>       speech-rate multiplier, default 1.0 (0.5-2.0)
  --voice <voice_id>    override the voice id from .env
  --encoding <ext>      mp3 / wav / pcm, default mp3
  --timestamps          request word-level timestamps (enable_subtitle); the result JSON gains a words array
  --yes                 confirm sending the text to the official Doubao TTS endpoint (or set STUDIO_CLOUD_OK=1)
`.trim());
  process.exit(1);
}

function getDuration(filePath) {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ], { encoding: 'utf8' });
    return parseFloat(out.trim());
  } catch (e) {
    return null;
  }
}

function inferResourceId(voiceId) {
  // Cloned voices default to 2.0: this account only has seed-icl-2.0 enabled (1.0 returns
  // 403 resource not granted), and word-level timestamps (enable_subtitle) only work on 2.0
  // resources.
  if (voiceId.startsWith('S_')) return 'seed-icl-2.0';
  if (voiceId.includes('uranus')) return 'seed-tts-2.0';
  return 'seed-tts-1.0';
}

function speedToSpeechRate(speed) {
  const ratio = parseFloat(speed);
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(-50, Math.min(100, Math.round((ratio - 1) * 100)));
}

function buildAuthHeaders({ requestId, resourceId }) {
  const apiKey = process.env.DOUBAO_TTS_API_KEY;
  const appId = process.env.DOUBAO_APP_ID;
  const accessKey = process.env.DOUBAO_ACCESS_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Resource-Id': resourceId,
    'X-Api-Request-Id': requestId,
  };

  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
    return headers;
  }

  if (!appId) throw new Error('missing DOUBAO_TTS_API_KEY or DOUBAO_APP_ID (check .env)');
  if (!accessKey) throw new Error('missing DOUBAO_ACCESS_KEY (check .env)');

  headers['X-Api-App-Id'] = appId;
  headers['X-Api-Access-Key'] = accessKey;
  return headers;
}

async function readV3Audio(res) {
  const text = await res.text();
  const chunks = [];
  const words = []; // word-level timestamps (the server returns sentence.words per sentence when enable_subtitle is on)
  let finalCode = null;
  let finalMessage = '';

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let json;
    try {
      json = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`API response line is not JSON: ${trimmed.slice(0, 200)}`);
    }

    const code = json.code ?? 0;
    if (code === 20000000) {
      finalCode = code;
      finalMessage = json.message || '';
      break;
    }
    if (code !== 0) {
      throw new Error(`API returned error code=${code} msg=${json.message || JSON.stringify(json)}`);
    }
    if (json.data) chunks.push(Buffer.from(json.data, 'base64'));
    if (json.sentence && Array.isArray(json.sentence.words)) {
      for (const w of json.sentence.words) {
        words.push({
          text: w.word,
          start: w.startTime,
          end: w.endTime,
          confidence: w.confidence,
        });
      }
    }
  }

  if (!chunks.length) {
    const detail = finalCode ? `end code ${finalCode} ${finalMessage}` : text.slice(0, 500);
    throw new Error(`API response contains no audio data: ${detail}`);
  }
  return { audio: Buffer.concat(chunks), words };
}

// endpoint domain allowlist: the key and the text may only go to ByteDance's official
// domains, so a tampered .env cannot redirect them
const ALLOWED_ENDPOINT_HOSTS = /(^|\.)(bytedance\.com|volces\.com)$/;

async function tts({ text, voice, speed, encoding, timestamps }) {
  const endpoint = process.env.DOUBAO_TTS_ENDPOINT || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';
  const host = new URL(endpoint).hostname;
  if (!ALLOWED_ENDPOINT_HOSTS.test(host)) {
    throw new Error(`DOUBAO_TTS_ENDPOINT host ${host} is not in the allowlist (*.bytedance.com / *.volces.com), refusing to send`);
  }
  const voiceId = voice || process.env.DOUBAO_TTS_VOICE_ID || process.env.DOUBAO_SPEAKER;
  const resourceId = process.env.DOUBAO_TTS_RESOURCE_ID || inferResourceId(voiceId || '');
  const requestId = randomUUID();

  if (!voiceId) throw new Error('missing DOUBAO_TTS_VOICE_ID (check .env or pass --voice)');

  const body = {
    user: { uid: 'dsh-studio' },
    req_params: {
      text,
      speaker: voiceId,
      audio_params: {
        format: encoding,
        sample_rate: 24000,
        speech_rate: speedToSpeechRate(speed),
        // word-level timestamps: only 2.0 resources (seed-tts-2.0 / seed-icl-2.0) support
        // them, Chinese and English only
        ...(timestamps ? { enable_subtitle: true } : {}),
      },
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: buildAuthHeaders({ requestId, resourceId }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  return readV3Audio(res);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) usage();

  let text = args.text;
  if (!text && args.textFile) {
    text = fs.readFileSync(args.textFile, 'utf8').trim();
  }
  if (!text) {
    console.error('Error: missing --text or --text-file');
    usage();
  }
  if (!args.out) {
    console.error('Error: missing --out');
    usage();
  }

  if (!args.yes && process.env.STUDIO_CLOUD_OK !== '1') {
    const host = new URL(process.env.DOUBAO_TTS_ENDPOINT || 'https://openspeech.bytedance.com').hostname;
    console.error(
      `[cloud consent] This run will send about ${text.length} characters of text to ${host} (the official Doubao TTS endpoint, using your own key to synthesize speech).\n` +
      `If that is fine, re-run with --yes, or set the environment variable STUDIO_CLOUD_OK=1. See SECURITY.md for the data-flow statement.`,
    );
    process.exit(2);
  }

  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const { audio, words } = await tts({
    text,
    voice: args.voice,
    speed: args.speed,
    encoding: args.encoding,
    timestamps: args.timestamps,
  });

  fs.writeFileSync(outPath, audio);
  const duration = getDuration(outPath);
  const result = {
    path: outPath,
    bytes: audio.length,
    duration,
    text_chars: text.length,
  };
  if (args.timestamps) result.words = words;
  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.error(`TTS failed: ${err.message}`);
  process.exit(1);
});
