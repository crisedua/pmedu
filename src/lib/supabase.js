import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Connection Diagnostics
console.log('[Supabase] Initializing client...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL ERROR: Missing environment variables!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Defined' : 'UNDEFINED');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Defined' : 'UNDEFINED');
} else {
    // Masked logging for safety
    const maskedUrl = supabaseUrl.substring(0, 10) + '...';
    const isValidUrl = supabaseUrl.startsWith('http');
    console.log(`[Supabase] URL: ${maskedUrl} (Valid format: ${isValidUrl})`);

    if (!isValidUrl) {
        console.error('[Supabase] ERROR: URL does not start with http/https! Check your .env or cloud settings.');
    }
}

export const supabase = createClient(supabaseUrl || 'https://missing-url.supabase.co', supabaseAnonKey || 'missing-key');
