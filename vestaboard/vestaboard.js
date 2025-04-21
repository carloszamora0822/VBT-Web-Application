import 'dotenv/config';

// Keep track of last update time and rate limit status
let lastUpdateTime = null;
let currentRateLimit = {
    isLimited: false,
    retryAfter: null,
    limitExpires: null,
    source: null
};

// Export the rate limit info for UI access
export function getRateLimitInfo() {
    if (!currentRateLimit.isLimited) {
        return { 
            isLimited: false, 
            message: "No rate limit detected"
        };
    }
    
    const now = new Date();
    if (currentRateLimit.limitExpires && now < currentRateLimit.limitExpires) {
        const timeRemaining = Math.ceil((currentRateLimit.limitExpires - now) / 1000);
        return {
            isLimited: true,
            timeRemaining,
            source: currentRateLimit.source,
            message: `Rate limited for ${timeRemaining} more seconds. Source: ${currentRateLimit.source || 'Unknown'}`
        };
    }
    
    return { 
        isLimited: false, 
        message: "Rate limit expired"
    };
}

export async function updateVestaboard(matrix) {
    const apiKey = process.env.VESTA_API_KEY;
    if (!apiKey) throw new Error('Missing API key');

    try {
        const startTime = new Date();
        const now = new Date();
        console.log(`[TIMING-DEBUG] ${startTime.toISOString()} - Starting Vestaboard API call`);
        
        // Check if there was a previous update and log the time difference
        if (lastUpdateTime) {
            const timeSinceLastUpdate = now - lastUpdateTime;
            const secondsSinceLastUpdate = (timeSinceLastUpdate/1000).toFixed(1);
            
            console.log(`[RATE-DEBUG] Time since last Vestaboard update: ${timeSinceLastUpdate}ms (${secondsSinceLastUpdate} seconds)`);
            
            // Log a special warning if it's close to 5 minutes
            if (secondsSinceLastUpdate > 290 && secondsSinceLastUpdate < 310) {
                console.log(`[RATE-ALERT] ⚠️ DETECTED ~5 MINUTE DELAY PATTERN: ${secondsSinceLastUpdate} seconds ⚠️`);
            }
        }
        
        // Check if we're currently rate limited
        if (currentRateLimit.isLimited) {
            const now = new Date();
            if (currentRateLimit.limitExpires && now < currentRateLimit.limitExpires) {
                const timeRemaining = (currentRateLimit.limitExpires - now) / 1000;
                console.error(`[RATE-LIMIT] Still rate limited for another ${timeRemaining.toFixed(1)} seconds. Source: ${currentRateLimit.source || 'Unknown'}`);
                
                // Return the error with timing information
                const error = new Error(`Vestaboard API rate limited. Please try again in ${timeRemaining.toFixed(0)} seconds.`);
                error.rateLimit = {
                    timeRemaining: Math.ceil(timeRemaining),
                    source: currentRateLimit.source
                };
                throw error;
            } else {
                // Rate limit has expired
                console.log(`[RATE-LIMIT] Previous rate limit has expired, attempting request`);
                currentRateLimit.isLimited = false;
            }
        }
        
        // Add a unique timestamp to help bypass cache-based rate limits
        const cacheBuster = Date.now();
        
        // Make the API call with cache-busting
        const response = await fetch(`https://rw.vestaboard.com/?t=${cacheBuster}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Vestaboard-Read-Write-Key': apiKey,
                'Cache-Control': 'no-cache, no-store',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify(matrix)
        });

        // Update last successful call time
        lastUpdateTime = new Date();
        
        const endTime = new Date();
        const elapsedMs = endTime - startTime;
        console.log(`[TIMING-DEBUG] ${endTime.toISOString()} - Vestaboard API call completed in ${elapsedMs}ms`);

        // Log all response headers to check for rate limiting info
        console.log('[RESPONSE-HEADERS] Vestaboard API response headers:');
        let foundRateLimitHeaders = false;
        
        for (const [key, value] of response.headers.entries()) {
            console.log(`[RESPONSE-HEADER] ${key}: ${value}`);
            
            // Look for additional rate limit headers
            if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('limit')) {
                console.log(`[RATE-INFO] ⚠️ Found rate limit related header: ${key}: ${value} ⚠️`);
                foundRateLimitHeaders = true;
            }
        }
        
        // Special logging if no rate limit headers were found
        if (!foundRateLimitHeaders) {
            console.log(`[RATE-INFO] No explicit rate limit headers found in response`);
        }

        // Check specifically for rate limiting responses
        if (response.status === 429) {
            // Parse retry-after header
            const retryAfter = response.headers.get('Retry-After');
            const retrySeconds = parseInt(retryAfter, 10) || 300; // Default to 5 minutes if not specified
            
            // Set rate limit information
            currentRateLimit.isLimited = true;
            currentRateLimit.retryAfter = retrySeconds;
            currentRateLimit.limitExpires = new Date(Date.now() + (retrySeconds * 1000));
            currentRateLimit.source = "HTTP 429 Too Many Requests";
            
            console.error(`[RATE-LIMIT] ⚠️ EXPLICIT RATE LIMIT: Vestaboard API returned 429 Too Many Requests. Retry after: ${retrySeconds} seconds. Will be available at ${currentRateLimit.limitExpires.toISOString()} ⚠️`);
            
            // Return the error with timing information
            const error = new Error(`Vestaboard API rate limited for ${retrySeconds} seconds.`);
            error.rateLimit = {
                timeRemaining: retrySeconds,
                source: "HTTP 429 Too Many Requests"
            };
            throw error;
        }

        if (!response.ok) {
            console.error(`[API-ERROR] Vestaboard API returned status ${response.status}`);
            const errorText = await response.text();
            console.error(`[API-ERROR] Response: ${errorText}`);
            
            let errorSource = `HTTP ${response.status}`;
            
            // Check for other error codes that might indicate rate limiting
            if (response.status === 403) {
                errorSource = "HTTP 403 Forbidden - possible IP-based rate limit";
                console.error(`[RATE-INFO] ⚠️ Received 403 Forbidden - this may indicate an IP-based rate limit ⚠️`);
                
                // Set rate limit information
                currentRateLimit.isLimited = true;
                currentRateLimit.retryAfter = 300; // Assume 5 minutes for 403
                currentRateLimit.limitExpires = new Date(Date.now() + (300 * 1000));
                currentRateLimit.source = errorSource;
            } else if (response.status === 503) {
                errorSource = "HTTP 503 Service Unavailable - possible throttling";
                console.error(`[RATE-INFO] ⚠️ Received 503 Service Unavailable - this may indicate the service is throttling requests ⚠️`);
                
                // Set rate limit information
                currentRateLimit.isLimited = true;
                currentRateLimit.retryAfter = 300; // Assume 5 minutes for 503
                currentRateLimit.limitExpires = new Date(Date.now() + (300 * 1000));
                currentRateLimit.source = errorSource;
            }
            
            const error = new Error(`Vestaboard API error: ${response.status} ${errorText}`);
            if (currentRateLimit.isLimited) {
                error.rateLimit = {
                    timeRemaining: currentRateLimit.retryAfter,
                    source: errorSource
                };
            }
            throw error;
        }

        // Reset rate limit if successful
        currentRateLimit.isLimited = false;
        
        return await response.json();
    } catch (error) {
        console.error(`[ERROR] ${new Date().toISOString()} - Vestaboard API call failed:`, error);
        throw error;
    }
}
