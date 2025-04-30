import { createVestaMatrix } from '../../vestaboard/vestaConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

// In-memory cache for the current request
let flightsCache = [];

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;

/**
 * Load flights from the database
 */
async function loadFlights() {
    try {
        console.log('Loading flights from MongoDB...');
        const collection = await getCollection('flights');
        const flights = await collection.find({}).toArray();
        
        console.log(`Loaded ${flights.length} flights from MongoDB`);
        
        // Transform from MongoDB document to flight object
        const flightObjects = flights.map(doc => ({
            _id: doc._id,
            time: doc.time || '',
            callsign: doc.callsign || '',
            type: doc.type || '',
            destination: doc.destination || ''
        }));
        
        // Sort flights chronologically by time
        const sortedFlights = flightObjects.sort((a, b) => {
            // Convert time (HH:MM format) to minutes for comparison
            const aMinutes = timeToMinutes(a.time);
            const bMinutes = timeToMinutes(b.time);
            
            // Sort by time (ascending)
            return aMinutes - bMinutes;
        });
        
        // Limit to 10 flights after sorting
        return sortedFlights.slice(0, 10);
    } catch (error) {
        console.error('Error loading flights from MongoDB:', error);
        return []; // Return empty array on error
    }
}

/**
 * Convert time in military format (HH:MM or HHMM) to minutes for comparison
 * @param {string} timeStr Time string in military format
 * @returns {number} Total minutes
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return Number.MAX_SAFE_INTEGER; // Invalid times go to the end
    
    // Handle multiple formats
    let hours, minutes;
    
    // Format: HH:MM
    if (timeStr.includes(':')) {
        [hours, minutes] = timeStr.split(':').map(Number);
    } 
    // Format: HHMM
    else if (timeStr.length === 4) {
        hours = parseInt(timeStr.substring(0, 2), 10);
        minutes = parseInt(timeStr.substring(2, 4), 10);
    }
    // Format: H:MM or HMM
    else if (timeStr.length === 3) {
        if (timeStr.includes(':')) {
            [hours, minutes] = timeStr.split(':').map(Number);
        } else {
            hours = parseInt(timeStr.substring(0, 1), 10);
            minutes = parseInt(timeStr.substring(1, 3), 10);
        }
    }
    // Invalid format
    else {
        return Number.MAX_SAFE_INTEGER; // Invalid times go to the end
    }
    
    // Validate
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return Number.MAX_SAFE_INTEGER; // Invalid times go to the end
    }
    
    return (hours * 60) + minutes;
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
        
        try {
            // Update the Vestaboard
            const result = await updateVestaboard(matrix);
            console.log('Vestaboard update result:', JSON.stringify(result));
            
            console.log('Vestaboard updated successfully at', new Date().toISOString());
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
            const parts = req.url.split('/');
            const lastPart = parts[parts.length - 1];
            
            // Check if we have an ID parameter
            if (lastPart.includes('?id=')) {
                const id = lastPart.split('?id=')[1];
                console.log('Deleting flight with ID:', id);
                
                try {
                    const { ObjectId } = require('mongodb');
                    const objectId = new ObjectId(id);
                    
                    // Get collection and delete the document
                    const collection = await getCollection('flights');
                    const result = await collection.deleteOne({ _id: objectId });
                    
                    if (result.deletedCount === 0) {
                        return res.status(404).json({ 
                            success: false,
                            message: 'Flight not found'
                        });
                    }
                    
                    // Reload the flights after deletion
                    const updatedFlights = await loadFlights();
                    
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
                    console.error('Error parsing ObjectId:', error);
                    return res.status(400).json({ 
                        success: false,
                        message: 'Invalid ID format'
                    });
                }
            } 
            // Backward compatibility for index-based deletion
            else {
                const index = parseInt(lastPart);
                
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
            }
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
