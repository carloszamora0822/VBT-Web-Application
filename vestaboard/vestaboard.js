import 'dotenv/config';

export async function updateVestaboard(matrix) {
    const apiKey = process.env.VESTA_API_KEY;
    if (!apiKey) throw new Error('Missing API key');

    try {
        const response = await fetch('https://rw.vestaboard.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Vestaboard-Read-Write-Key': apiKey
            },
            body: JSON.stringify(matrix)
        });

        return await response.json();
    } catch (error) {
        throw error;
    }
}
