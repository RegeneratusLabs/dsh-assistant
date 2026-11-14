import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root (this package's own checkout). */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULTS = {
  home: path.join(os.homedir(), '.dsh-assistant'),
  name: 'assistant',
  port: 7310,
};

/** Expand `~` and resolve a user-supplied path. */
export function expandHome(value) {
  if (value === '~') return os.homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(os.homedir(), value.slice(2));
  return path.resolve(value);
}

/** `<home>/profiles/<name>` — the DSH profile directory. */
export function profileDir(home, name) {
  return path.join(home, 'profiles', name);
}

/**
 * Bundles the personal profile composes by default.
 *
 * Voice input and the plugin index are official bundles shipped with the DSH
 * installation (not npm dependencies), so they cost no install and only add
 * patch rows. Auto review stays opt-in: it changes how tool calls are judged.
 */
const BASE_BUNDLES = [
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  '@local/dsh-soul',
  '@local/dsh-memory',
  '@local/dsh-learn',
];

/** The profile manifest: bundles plus local plugin links and the browser plugin. */
export function buildManifest({ browser = true, voice = true, market = true, autoReview = false } = {}) {
  const dependencies = {
    '@local/dsh-soul': `link:${path.join(repoRoot, 'plugins', 'soul')}`,
    '@local/dsh-memory': `link:${path.join(repoRoot, 'plugins', 'memory')}`,
    '@local/dsh-learn': `link:${path.join(repoRoot, 'plugins', 'learn')}`,
  };
  const bundles = [...BASE_BUNDLES];
  if (browser) {
    dependencies['dsh-ego-browser'] = '0.9.14';
    bundles.push('dsh-ego-browser');
  }
  if (voice) bundles.push('@deepseek-ai/dsh-experimental-voice-input-bundle');
  if (market) bundles.push('@deepseek-ai/dsh-experimental-plugin-market-bundle');
  if (autoReview) bundles.push('@deepseek-ai/dsh-experimental-auto-review');
  return {
    name: 'dsh-assistant-profile',
    private: true,
    dependencies,
    dsh: { profile: { bundles } },
  };
}
