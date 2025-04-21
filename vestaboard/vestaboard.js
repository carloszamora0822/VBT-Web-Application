import 'dotenv/config';

export async function updateVestaboard(matrix) {
    const apiKey = process.env.VESTA_API_KEY;
    if (!apiKey) throw new Error('Missing API key');

    try {
        const startTime = new Date();
        console.log(`[TIMING] Starting Vestaboard API call at ${startTime.toISOString()}`);
        
        const response = await fetch('https://rw.vestaboard.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Vestaboard-Read-Write-Key': apiKey
            },
            body: JSON.stringify(matrix)
        });

        const endTime = new Date();
        const elapsedMs = endTime - startTime;
        console.log(`[TIMING] Vestaboard API call completed in ${elapsedMs}ms at ${endTime.toISOString()}`);

        // Check for rate limiting responses
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            console.error(`[RATE LIMIT] Vestaboard API rate limited. Retry after: ${retryAfter || 'unknown'} seconds`);
            throw new Error(`Vestaboard API rate limited. Please try again later.`);
        }

        if (!response.ok) {
            console.error(`[API ERROR] Vestaboard API returned status ${response.status}`);
            const errorText = await response.text();
            console.error(`[API ERROR] Response: ${errorText}`);
            throw new Error(`Vestaboard API error: ${response.status} ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[TIMING] Vestaboard API call failed:', error);
        throw error;
    }
}
