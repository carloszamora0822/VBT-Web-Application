import { getRateLimitInfo } from '../../vestaboard/vestaboard';

export default async function handler(req, res) {
    // Basic CORS setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        try {
            // Get current rate limit info
            const rateLimitInfo = getRateLimitInfo();
            
            // Log the status to help with debugging
            console.log(`[RATE-STATUS] Reporting rate limit status to client:`, rateLimitInfo);
            
            // Return the current status
            return res.status(200).json(rateLimitInfo);
        } catch (error) {
            console.error('Error getting rate limit status:', error);
            return res.status(500).json({ 
                isLimited: false,
                message: 'Error retrieving rate limit status'
            });
        }
    }

    // Return 405 Method Not Allowed for any other HTTP methods
    return res.status(405).json({
        message: 'Method not allowed'
    });
}
