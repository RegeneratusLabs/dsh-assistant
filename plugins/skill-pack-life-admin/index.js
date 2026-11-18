/**
 * Life-admin skill pack.
 *
 * Task knowledge is a folder of plain SKILL.md files, not a feature: this
 * bundle is the distribution channel for `skills/life-admin/`. It registers one
 * read-only provider over its vendored `assets/skills/`, so a profile gains the
 * cluster by enabling one row and loses it by switching the row off.
 *
 * Skills are toggled one by one through `skills` in the row config. The field
 * is volatile, so a toggle republishes the catalog instead of restarting the
 * plugin, and the provider reads it live on every list.
 *
 * @module @local/dsh-skill-pack-life-admin
 */

import { fileURLToPath } from 'node:url';
import z from '@deepseek-ai/schemastery';

import { createSkillProvider } from '../skill-pack-shared/provider.mjs';

/** This plugin's Loader row id / Cordis plugin name. */
export const name = 'dsh-skill-pack-life-admin';

/** The skill registry is the only service this plugin needs. */
export const inject = ['skills'];

/**
 * One boolean per vendored skill. The row ships every skill true; a profile
 * override flips the ones it does not want.
 */
export const Config = z.object({
  skills: z.dict(z.boolean()).default({}).volatile(),
});

/**
 * Register this pack's skills with the Host.
 * @param ctx - Cordis context with the skills registry.
 * @param config - Loader row config; `skills` is a live accessor.
 */
export function apply(ctx, config = {}) {
  const flags = () => (typeof config.skills?.get === 'function' ? config.skills.get() : config.skills) ?? {};
  ctx.skills.registerProvider((control) =>
    createSkillProvider({
      provider: name,
      assetRoot: fileURLToPath(new URL('./assets/skills/', import.meta.url)),
      flags,
      logger: ctx.logger,
      invalidate: control.invalidate,
    }),
  );
}
