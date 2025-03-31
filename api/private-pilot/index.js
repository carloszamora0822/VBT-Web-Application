import { createPrivatePilotMatrix } from '../../vestaboard/privatePilotConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

console.log('[FILE USED] /api/private-pilot/index.js');

// In-memory cache for the current request
let pilotCache = null;

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;
// Timestamp of the last update
let lastUpdateTime = 0;

/**
 * Load private pilot from the database
 */
async function loadPrivatePilot() {
    try {
        console.log('Loading private pilot from MongoDB...');
        const collection = await getCollection('privatePilot');
        const record = await collection.findOne({}, { sort: { _id: -1 } });
        
        console.log(`Loaded private pilot from MongoDB:`, record);
        
        // Return the record if found, or null if not
        return record ? {
            name: record.name || ''
        } : null;
    } catch (error) {
        console.error('Error loading private pilot from MongoDB:', error);
        return null; // Return null on error
    }
}

/**
 * Save private pilot to the database
 * @param {Object} pilot The private pilot record to save
 */
async function savePrivatePilot(pilot) {
    try {
        console.log(`Saving private pilot to MongoDB:`, pilot);
        
        const collection = await getCollection('privatePilot');
        
        // Clear existing record and insert new one
        await collection.deleteMany({});
        
        if (pilot && pilot.name) {
            await collection.insertOne({
                name: pilot.name,
                createdAt: new Date()
            });
        }
        
        console.log(`Saved private pilot to MongoDB`);
        
        // Update the in-memory cache
        pilotCache = { ...pilot };
        return pilot;
    } catch (error) {
        console.error('Error saving private pilot to MongoDB:', error);
        return pilotCache; // Return cached data on error
    }
}

/**
 * Update the Vestaboard with the private pilot
 * @param {Object} pilot The private pilot to display
 */
async function updateVestaboardWithPilot(pilot) {
    // If already updating, don't do anything
    if (isUpdatingVestaboard) {
        console.log('Already updating Vestaboard, skipping this update request');
        return;
    }

    try {
        // Set flag to prevent concurrent updates
        isUpdatingVestaboard = true;
        console.log('Starting Vestaboard update with private pilot:', JSON.stringify(pilot));

        if (!pilot || !pilot.name) {
            throw new Error('Missing pilot name');
        }

        // Create matrix with pilot name
        const matrix = createPrivatePilotMatrix(pilot.name);
        
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

export default async function handler(req, res) {
    // Basic CORS setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Always load private pilot from database to ensure we have the latest data
        pilotCache = await loadPrivatePilot();
    } catch (error) {
        console.error('Failed to load private pilot:', error);
        // Continue with empty cache if database access fails
        pilotCache = null;
    }

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            // Load private pilot from database
            const pilot = await loadPrivatePilot();
            
            if (!pilot || !pilot.name) {
                return res.status(400).json({ 
                    error: 'No private pilot data found' 
                });
            }
            
            // Create Vestaboard matrix
            const matrix = createPrivatePilotMatrix(pilot.name);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    // Get private pilot
    if (req.method === 'GET') {
        try {
            console.log('GET request received, returning private pilot:', pilotCache);
            return res.status(200).json(pilotCache || { name: '' });
        } catch (error) {
            console.error('Error in GET private pilot:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch private pilot',
                success: false
            });
        }
    }

    // Save private pilot
    if (req.method === 'POST') {
        try {
            // Check if this is just a Vestaboard update request
            if (req.body.updateVestaboardOnly === true) {
                console.log('Received Vestaboard-only update request for private pilot');
                
                // Get the current private pilot from the database
                const currentPilot = await loadPrivatePilot();
                
                if (!currentPilot || !currentPilot.name) {
                    return res.status(400).json({
                        success: false,
                        message: 'No private pilot data found to display on Vestaboard'
                    });
                }
                
                // Update Vestaboard with current private pilot
                try {
                    const vestaUpdateSuccess = await updateVestaboardWithPilot(currentPilot);
                    
                    if (vestaUpdateSuccess) {
                        return res.status(200).json({
                            success: true,
                            message: 'Vestaboard updated successfully with private pilot'
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update Vestaboard with private pilot'
                        });
                    }
                } catch (vestaError) {
                    console.error('Error updating Vestaboard with private pilot:', vestaError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating Vestaboard with private pilot'
                    });
                }
            }
            
            // This is a standard update request for private pilot
            console.log('Received private pilot update:', req.body);
            
            // Validate required fields
            if (!req.body.name) {
                return res.status(400).json({
                    success: false,
                    message: 'Pilot name is required'
                });
            }
            
            // Create private pilot object
            const pilot = {
                name: req.body.name.trim()
            };
            
            // Save to the database
            const savedPilot = await savePrivatePilot(pilot);
            
            // Update Vestaboard if requested
            let vestaboardUpdateSuccess = false;
            if (req.body.updateVestaboard === true) {
                vestaboardUpdateSuccess = await updateVestaboardWithPilot(savedPilot);
            }
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: 'Private pilot saved successfully',
                vestaboardUpdated: vestaboardUpdateSuccess,
                pilot: savedPilot
            });
            
        } catch (error) {
            console.error('Error in POST private pilot:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to save private pilot',
                error: error.message
            });
        }
    }

    // Return 405 Method Not Allowed for any other HTTP methods
    return res.status(405).json({
        success: false,
        message: 'Method not allowed'
    });
}
