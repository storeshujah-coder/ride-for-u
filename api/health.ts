import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Health Check & Activity Endpoint (GET /api/health)
 * -------------------------------------------------------------
 * Purpose:
 * 1. Executes a safe, read-only query against Supabase to keep the project active on the Free Plan.
 * 2. Does NOT modify, insert, or delete any business, vehicle, driver, or financial records.
 * 3. Does NOT create fake data.
 * 4. Strictly enforces an execution timeout (5000ms) so it cannot hang indefinitely.
 * 5. Returns HTTP 200 when healthy, or HTTP 503 / 500 when Supabase is unreachable.
 */

// Maximum time to wait for Supabase to respond before aborting (in milliseconds)
const HEALTH_CHECK_TIMEOUT_MS = 5000;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set CORS and JSON response headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  // Handle HTTP OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Only allow GET and HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
    return;
  }

  // Read environment variables (supports standard Vercel or Vite prefixed variables)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)',
      })
    );
    return;
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    // Create an isolated Supabase client using the anon key (no service role required)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    /**
     * Read-Only Activity Query:
     * - Querying 'departments' or 'notifications' with .limit(1) sends a legitimate SELECT query to PostgreSQL.
     * - This generates real database activity without writing, modifying, or locking any business data.
     * - Using .abortSignal ensures the query terminates quickly if the database is paused or unreachable.
     */
    const { error } = await supabase
      .from('departments')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      const latencyMs = Date.now() - startTime;
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          status: 'error',
          timestamp: new Date().toISOString(),
          latency_ms: latencyMs,
          message: 'Supabase returned an error during health check',
          error: error.message,
        })
      );
      return;
    }

    const latencyMs = Date.now() - startTime;
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        latency_ms: latencyMs,
      })
    );
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = controller.signal.aborted;
    const errorMessage = err instanceof Error ? err.message : String(err);

    res.statusCode = 503;
    res.end(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        latency_ms: latencyMs,
        message: isTimeout
          ? `Health check timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`
          : 'Database connection failed',
        error: isTimeout ? 'Request Timeout' : errorMessage,
      })
    );
  }
}
