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

/** The profile manifest: bundles plus local plugin links and the browser plugin. */
export function buildManifest({ browser = true } = {}) {
  const dependencies = {
    '@local/dsh-soul': `link:${path.join(repoRoot, 'plugins', 'soul')}`,
    '@local/dsh-memory': `link:${path.join(repoRoot, 'plugins', 'memory')}`,
  };
  const bundles = [
    '@deepseek-ai/dsh-base',
    '@deepseek-ai/dsh-web-app',
    '@local/dsh-soul',
    '@local/dsh-memory',
  ];
  if (browser) {
    dependencies['dsh-ego-browser'] = '0.9.14';
    bundles.push('dsh-ego-browser');
  }
  return {
    name: 'dsh-assistant-profile',
    private: true,
    dependencies,
    dsh: { profile: { bundles } },
  };
}
