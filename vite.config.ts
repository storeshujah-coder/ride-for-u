import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

function healthCheckPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'supabase-health-check-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/health' || req.url?.startsWith('/api/health?')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.statusCode = 405;
            res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
            return;
          }

          const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseAnonKey) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                message: 'Missing Supabase environment variables in local configuration',
              })
            );
            return;
          }

          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            });

            const { error } = await supabase
              .from('departments')
              .select('id')
              .limit(1)
              .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
              res.statusCode = 503;
              res.end(
                JSON.stringify({
                  status: 'error',
                  timestamp: new Date().toISOString(),
                  latency_ms: Date.now() - startTime,
                  message: 'Supabase returned an error during health check',
                  error: error.message,
                })
              );
              return;
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
                latency_ms: Date.now() - startTime,
              })
            );
          } catch (err: unknown) {
            clearTimeout(timeoutId);
            const isTimeout = controller.signal.aborted;
            const errorMessage = err instanceof Error ? err.message : String(err);
            res.statusCode = 503;
            res.end(
              JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                latency_ms: Date.now() - startTime,
                message: isTimeout
                  ? 'Health check timed out after 5000ms'
                  : 'Database connection failed',
                error: isTimeout ? 'Request Timeout' : errorMessage,
              })
            );
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), healthCheckPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});

