import { createVestaMatrix } from '../../vestaboard/vestaConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

// In-memory cache for the current request
let flightsCache = [];

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;
// Timestamp of the last update
let lastUpdateTime = 0;

/**
 * Load flights from the database
 */
async function loadFlights() {
    try {
        console.log('Loading flights from MongoDB...');
        const collection = await getCollection('flights');
        const flights = await collection.find({}).sort({ _id: -1 }).limit(10).toArray();
        
        console.log(`Loaded ${flights.length} flights from MongoDB`);
        
        // Transform from MongoDB document to flight object
        return flights.map(doc => ({
            time: doc.time || '',
            callsign: doc.callsign || '',
            type: doc.type || '',
            destination: doc.destination || ''
        }));
    } catch (error) {
        console.error('Error loading flights from MongoDB:', error);
        return []; // Return empty array on error
    }
}

/**
 * Save flights to the database
 * @param {Array} flights The flights to save
 */
async function saveFlights(flights) {
    try {
        console.log(`Saving ${flights.length} flights to MongoDB...`);
        
        const collection = await getCollection('flights');
        
        // Clear existing flights and insert new ones
        await collection.deleteMany({});
        
        if (flights.length > 0) {
            await collection.insertMany(flights.map(flight => ({
                time: flight.time || '',
                callsign: flight.callsign || '',
                type: flight.type || '',
                destination: flight.destination || '',
                createdAt: new Date()
            })));
        }
        
        console.log(`Saved ${flights.length} flights to MongoDB`);
        
        // Update the in-memory cache
        flightsCache = [...flights];
        return flights;
    } catch (error) {
        console.error('Error saving flights to MongoDB:', error);
        return flightsCache; // Return cached data on error
    }
}

/**
 * Function to ensure we don't exceed 5 flights 
 * @param {Array} flights The flights array to cap
 * @returns {Array} The capped flights array
 */
function capFlightsArray(flights) {
    if (flights.length > 5) {
        console.log(`Capping flights array from ${flights.length} to 5 items`);
        return flights.slice(-5); // Keep the 5 newest flights
    }
    return flights;
}

/**
 * Update the Vestaboard with the given flights
 * @param {Array} flights The flights to display
 */
async function updateVestaboardWithFlights(flights) {
    // If already updating, don't do anything
    if (isUpdatingVestaboard) {
        console.log('Already updating Vestaboard, skipping this update request');
        return;
    }

    try {
        // Set flag to prevent concurrent updates
        isUpdatingVestaboard = true;
        console.log('Starting Vestaboard update with flights:', JSON.stringify(flights));

        // Create matrix with flights
        const matrix = createVestaMatrix([...flights]);
        
        // Calculate time since last update
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        
        // If it's been less than 5 seconds since the last update, wait
        if (timeSinceLastUpdate < 5000) {
            const waitTime = 5000 - timeSinceLastUpdate;
            console.log(`Waiting ${waitTime}ms before updating Vestaboard to avoid rate limiting`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        try {
            // Update the Vestaboard
            const result = await updateVestaboard(matrix);
            console.log('Vestaboard update result:', JSON.stringify(result));
            
            // Update last update time
            lastUpdateTime = Date.now();
            console.log('Vestaboard updated successfully at', new Date(lastUpdateTime).toISOString());
            return true;
        } catch (vestaError) {
            console.error('Error updating Vestaboard:', vestaError);
            return false;
        }
    } catch (error) {
        console.error('Error preparing Vestaboard update:', error);
        return false;
    } finally {
        // Reset flag regardless of success or failure
        isUpdatingVestaboard = false;
    }
}

/**
 * API handler for flights
 * @param {Object} req The request object
 * @param {Object} res The response object
 */
export default async function handler(req, res) {
    // CORS Headers - allow any origin to access this API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            // Load flights from database
            const flights = await loadFlights();
            
            // Create Vestaboard matrix
            const matrix = createVestaMatrix(flights);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    try {
        // Always load flights from database to ensure we have the latest data
        flightsCache = await loadFlights();
    } catch (error) {
        console.error('Failed to load flights:', error);
        // Continue with empty cache if database access fails
        flightsCache = [];
    }

    // Get all flights
    if (req.method === 'GET') {
        try {
            console.log('GET request received, returning flights:', flightsCache.length);
            return res.status(200).json(flightsCache);
        } catch (error) {
            console.error('Error in GET flights:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch flights',
                success: false 
            });
        }
    }

    // Add new flight or refresh vestaboard
    if (req.method === 'POST') {
        try {
            // If it's a flight list, use it to update the Vestaboard
            if (req.body.flights && Array.isArray(req.body.flights)) {
                const flights = req.body.flights;
                console.log('Received flights list with length:', flights.length);
                
                // Cap flights to 5 and update Vestaboard with the flights
                await updateVestaboardWithFlights(flights);
                
                return res.status(200).json({
                    success: true,
                    flights: flights
                });
            }
            // If it's a single new flight to add
            else if (req.body.time && req.body.callsign && req.body.destination) {
                const newFlight = {
                    time: req.body.time,
                    callsign: req.body.callsign,
                    type: req.body.type || 'PPL',
                    destination: req.body.destination
                };
                
                console.log('Adding new flight:', newFlight);
                
                // Add to flights array
                const updatedFlights = [...flightsCache, newFlight];
                
                // Cap to 5 flights
                const capped = capFlightsArray(updatedFlights);
                
                // Save to database
                try {
                    await saveFlights(capped);
                } catch (dbError) {
                    console.error('Database save error:', dbError);
                    // Continue with the local changes even if database save fails
                }
                
                // Always update Vestaboard with the flights
                try {
                    await updateVestaboardWithFlights(capped);
                } catch (vestaError) {
                    console.error('Vestaboard update error:', vestaError);
                    // Continue even if Vestaboard update fails
                }
                
                return res.status(200).json({
                    success: true,
                    flights: capped
                });
            }
            else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid request format' 
                });
            }
        } catch (error) {
            console.error('Failed to add flight:', error);
            return res.status(500).json({ 
                message: 'Failed to add flight',
                success: false,
                error: error.message
            });
        }
    }

    // Delete flight
    if (req.method === 'DELETE') {
        try {
            const index = parseInt(req.url.split('/').pop());
            
            if (isNaN(index) || index < 0 || index >= flightsCache.length) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid index'
                });
            }

            const updatedFlights = [...flightsCache];
            const deletedFlight = updatedFlights[index];
            updatedFlights.splice(index, 1);
            console.log('Deleted flight at index', index, ':', deletedFlight);
            
            // Save updated flights list to database
            try {
                await saveFlights(updatedFlights);
            } catch (dbError) {
                console.error('Database save error on delete:', dbError);
                // Continue with the local changes even if database save fails
            }
            
            // Always update Vestaboard after deletion
            try {
                await updateVestaboardWithFlights(updatedFlights);
            } catch (vestaError) {
                console.error('Vestaboard update error on delete:', vestaError);
                // Continue even if Vestaboard update fails
            }
            
            return res.status(200).json({
                success: true,
                flights: updatedFlights
            });
        } catch (error) {
            console.error('Failed to delete flight:', error);
            return res.status(500).json({ 
                message: 'Failed to delete flight',
                success: false,
                error: error.message 
            });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
