import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async (request) => {
    // 1. Handle CORS (Optional, but good practice)
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

    // 2. Auth Check
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return new Response(JSON.stringify({
            error: 'Server Error: MERCADOPAGO_ACCESS_TOKEN is not defined in Netlify Environment Variables.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 3. Initialize MercadoPago
        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);

        // 4. Parse Body
        const reqBody = await request.json();
        const { title, price, email } = reqBody;

        // 5. Determine Origin for Redirects
        // In Netlify, Request.url is the function URL. We prefer the 'Origin' header from the client.
        const origin = request.headers.get('origin') || 'https://pmedu.netlify.app'; // Fallback if needed

        const successUrl = `${origin}/demo?status=success`;
        const failureUrl = `${origin}/demo?status=failure`;
        const pendingUrl = `${origin}/demo?status=pending`;

        // 6. Create Preference
        const body = {
            items: [
                {
                    id: 'lifetime-access',
                    title: title || 'Acceso de por vida Aido',
                    quantity: 1,
                    unit_price: Number(price) || 9.99,
                    currency_id: 'USD',
                }
            ],
            payer: {
                email: email || 'test@user.com'
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl
            },
            auto_return: 'approved',
        };

        const result = await preference.create({ body });

        return new Response(JSON.stringify({ init_point: result.init_point }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('MercadoPago Error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error processing payment request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// Netlify Route Configuration
export const config = {
    path: "/api/create_preference"
};
