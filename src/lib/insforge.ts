import { createClient } from '@insforge/sdk';

type InsforgeClient = ReturnType<typeof createClient>;

/**
 * Cliente InsForge server-only (singleton, lazy).
 *
 * Lee las credenciales de import.meta.env (contexto Astro/Vite en build) o de
 * process.env (scripts node/tsx como seed.ts). Usa la api_key admin: TODO el
 * acceso ocurre en build time o en scripts de servidor, nunca en el navegador.
 */
function readEnv(name: string): string | undefined {
  // import.meta.env existe en Astro/Vite; en node/tsx es undefined.
  const viteEnv =
    typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  return viteEnv?.[name] ?? process.env[name];
}

let _client: InsforgeClient | null = null;

export function db(): InsforgeClient {
  if (_client) return _client;
  const baseUrl = readEnv('INSFORGE_URL');
  const apiKey = readEnv('INSFORGE_API_KEY');
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Faltan INSFORGE_URL / INSFORGE_API_KEY en el entorno. ' +
        'Copia .env.example a .env o exporta las variables antes de ejecutar.'
    );
  }
  _client = createClient({ baseUrl, anonKey: apiKey });
  return _client;
}
