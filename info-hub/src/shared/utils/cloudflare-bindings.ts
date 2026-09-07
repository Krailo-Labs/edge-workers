import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Universal resolver for Cloudflare D1 Database binding.
 * Checks @cloudflare/next-on-pages request context, process.env, and globalThis bindings.
 * Supports both "infohub_db_v2" and "infohub_db" names.
 */
export function getCloudflareD1(): any {
  let cfEnv: any = null;
  try {
    cfEnv = getRequestContext()?.env;
  } catch {
    // Outside of next-on-pages execution context
  }

  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  const p = typeof process !== 'undefined' && process.env ? (process.env as any) : {};

  const db =
    cfEnv?.infohub_db_v2 ||
    cfEnv?.infohub_db ||
    p.infohub_db_v2 ||
    p.infohub_db ||
    g.infohub_db_v2 ||
    g.infohub_db ||
    g.env?.infohub_db_v2 ||
    g.env?.infohub_db ||
    g.__env__?.infohub_db_v2 ||
    g.__env__?.infohub_db ||
    null;

  return db;
}

/**
 * Universal resolver for Cloudflare Workers AI binding.
 * Checks @cloudflare/next-on-pages request context, process.env, and globalThis bindings.
 */
export function getCloudflareAI(): any {
  let cfEnv: any = null;
  try {
    cfEnv = getRequestContext()?.env;
  } catch {
    // Outside of next-on-pages execution context
  }

  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  const p = typeof process !== 'undefined' && process.env ? (process.env as any) : {};

  const ai =
    cfEnv?.AI ||
    p.AI ||
    g.AI ||
    g.env?.AI ||
    g.__env__?.AI ||
    null;

  return ai;
}

/**
 * Universal resolver for Cloudflare R2 Bucket binding (info_hub / infohub_assets).
 * Checks @cloudflare/next-on-pages request context, process.env, and globalThis bindings.
 */
export function getCloudflareR2(): any {
  let cfEnv: any = null;
  try {
    cfEnv = getRequestContext()?.env;
  } catch {
    // Outside of next-on-pages execution context
  }

  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  const p = typeof process !== 'undefined' && process.env ? (process.env as any) : {};

  const r2 =
    cfEnv?.info_hub ||
    cfEnv?.INFO_HUB ||
    cfEnv?.infohub_assets ||
    cfEnv?.R2_BUCKET ||
    cfEnv?.ASSETS_BUCKET ||
    p.info_hub ||
    p.INFO_HUB ||
    p.infohub_assets ||
    p.R2_BUCKET ||
    g.info_hub ||
    g.INFO_HUB ||
    g.env?.info_hub ||
    g.env?.INFO_HUB ||
    g.__env__?.info_hub ||
    g.__env__?.INFO_HUB ||
    null;

  return r2;
}
