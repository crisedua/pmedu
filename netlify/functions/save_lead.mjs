import { createClient } from '@supabase/supabase-js';

export default async (request) => {
    // Handle CORS
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get Supabase credentials from environment
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({
                error: 'Server configuration error: Supabase credentials missing'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse request body
        const { name, email, source } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({
                error: 'Email is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create Supabase client (server-side)
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert lead
        const { data, error } = await supabase
            .from('aido_leads')
            .insert([{
                name: name || null,
                email: email,
                source: source || 'unknown',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            return new Response(JSON.stringify({
                error: 'Database insert failed',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: data
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Save lead error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// Netlify Route Configuration
export const config = {
    path: "/api/save_lead"
};
