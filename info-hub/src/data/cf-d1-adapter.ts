/**
 * Cloudflare D1 Database Adapter (PROD)
 * 
 * Instructions for setup in Cloudflare:
 * 1. Create a D1 Database: `npx wrangler d1 create infohub-db`
 * 2. Add the binding to `wrangler.toml`:
 *    [[d1_databases]]
 *    binding = "DB"
 *    database_name = "infohub-db"
 *    database_id = "<your-db-id>"
 * 3. Initialize schema: `npx wrangler d1 execute infohub-db --file=./cloudflare-d1-schema.sql --remote`
 */

export interface Env {
  DB: any; // D1Database binding
  GEMINI_API_KEY: string;
}

// Example usage in Next.js Route Handler or Server Action running on Cloudflare Pages:
// import { getRequestContext } from '@cloudflare/next-on-pages';
// 
// export async function getContentUnits() {
//   const env = process.env as unknown as Env; // Or getRequestContext().env on Pages
//   const { results } = await env.DB.prepare('SELECT * FROM content_units').all();
//   return results;
// }
