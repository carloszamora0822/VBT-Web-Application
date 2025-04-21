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

        return await response.json();
    } catch (error) {
        console.error('[TIMING] Vestaboard API call failed:', error);
        throw error;
    }
}
