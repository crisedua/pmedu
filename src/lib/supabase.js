import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Connection Diagnostics
console.log('[Supabase] Initializing client (Safe Mode)...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL ERROR: Missing environment variables!');
} else {
    // Masked logging for safety
    const maskedUrl = supabaseUrl.substring(0, 10) + '...';
    console.log(`[Supabase] Targeted URL: ${maskedUrl}`);
}

// Safe Mode: Disable Realtime to prevent connection hangs
const options = {
    realtime: { enabled: false },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: { 'x-application-name': 'veta-project-manager' }
    }
};

export const supabase = createClient(
    supabaseUrl || 'https://missing-url.supabase.co',
    supabaseAnonKey || 'missing-key',
    options
);

// Perform a silent ping check
fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { 'apikey': supabaseAnonKey }
})
    .then(r => console.log(`[Supabase] REST Ping: ${r.status} ${r.statusText}`))
    .catch(e => console.error(`[Supabase] REST Ping Failed:`, e));
