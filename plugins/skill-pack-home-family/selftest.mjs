/**
 * Self-test for @local/dsh-skill-pack-home-family.
 *
 * The four packs assert the same things, so the body lives once in
 * ../skill-pack-shared/selftest.mjs; this file names the pack's directory.
 *
 * Run: node plugins/skill-pack-home-family/selftest.mjs
 */

import { runPackSelftest } from '../skill-pack-shared/selftest.mjs';

process.exit((await runPackSelftest(new URL('./', import.meta.url))) === 0 ? 0 : 1);
