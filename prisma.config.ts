import { defineConfig, env } from 'prisma/config';

try { process.loadEnvFile('.env.local'); } catch { /* vars may come from the shell instead */ }

// Migrations need Supabase's direct connection (port 5432), not the pooler.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: env('DIRECT_URL') },
});
