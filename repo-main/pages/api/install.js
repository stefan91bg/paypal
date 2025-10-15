 import { verifyToken } from '../../lib/auth';
    import { supabase } from '../../lib/supabaseClient';

    export default async function handler(req, res) {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization header missing' });
            }

            const token = authHeader.split(' ')[1];
            const decodedToken = verifyToken(token);
            const { workspaceId } = decodedToken;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID not found in token' });
            }

            // Koristimo 'upsert' da unesemo novi red samo ako ne postoji.
            // 'ignoreDuplicates: true' osigurava da ne dobijemo grešku ako red već postoji.
            const { error } = await supabase
                .from('installations')
                .upsert(
                    { workspace_id: workspaceId, download_count: 0 },
                    { onConflict: 'workspace_id', ignoreDuplicates: true }
                );

            if (error) {
                throw new Error(`Supabase upsert error: ${error.message}`);
            }

            res.status(200).json({ success: true, message: 'Installation recorded successfully.' });

        } catch (err) {
            console.error('API /install error:', err.message);
            res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
        }
    }
