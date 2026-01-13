import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined');
        }

        const client = new MercadoPagoConfig({ accessToken: accessToken });
        const preference = new Preference(client);

        // Dynamic base URL for redirects
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const origin = req.headers['origin'] || `${protocol}://${host}`;

        // Default to the current page + query params
        const successUrl = `${origin}/demo?status=success`;
        const failureUrl = `${origin}/demo?status=failure`;
        const pendingUrl = `${origin}/demo?status=pending`;

        const body = {
            items: [
                {
                    id: 'lifetime-access',
                    title: 'Acceso de por vida Aido',
                    quantity: 1,
                    unit_price: 15,
                    currency_id: 'USD',
                }
            ],
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl
            },
            auto_return: 'approved',
        };

        const response = await preference.create({ body });

        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: error.message || 'Error creating preference' });
    }
}
