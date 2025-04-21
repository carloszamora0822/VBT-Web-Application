import { createBirthdayMatrix } from '../../vestaboard/birthdayConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

console.log('[FILE USED] /api/birthday/index.js');

// In-memory cache for the current request
let birthdayCache = null;

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;

/**
 * Load birthday from the database
 */
async function loadBirthday() {
    try {
        console.log('Loading birthday from MongoDB...');
        const collection = await getCollection('birthday');
        const record = await collection.findOne({}, { sort: { _id: -1 } });
        
        console.log(`Loaded birthday from MongoDB:`, record);
        
        // Return the record if found, or null if not
        return record ? {
            firstName: record.firstName || '',
            date: record.date || ''
        } : null;
    } catch (error) {
        console.error('Error loading birthday from MongoDB:', error);
        return null; // Return null on error
    }
}

/**
 * Save birthday to the database
 * @param {Object} birthday The birthday record to save
 */
async function saveBirthday(birthday) {
    try {
        console.log(`Saving birthday to MongoDB:`, birthday);
        
        const collection = await getCollection('birthday');
        
        // Clear existing record and insert new one
        await collection.deleteMany({});
        
        if (birthday && birthday.firstName && birthday.date) {
            await collection.insertOne({
                firstName: birthday.firstName,
                date: birthday.date,
                createdAt: new Date()
            });
        }
        
        console.log(`Saved birthday to MongoDB`);
        
        // Update the in-memory cache
        birthdayCache = { ...birthday };
        return birthday;
    } catch (error) {
        console.error('Error saving birthday to MongoDB:', error);
        return birthdayCache; // Return cached data on error
    }
}

/**
 * Update the Vestaboard with the birthday
 * @param {Object} birthday The birthday to display
 */
async function updateVestaboardWithBirthday(birthday) {
    // If already updating, don't do anything
    if (isUpdatingVestaboard) {
        console.log('Already updating Vestaboard, skipping this update request');
        return;
    }

    try {
        // Set flag to prevent concurrent updates
        isUpdatingVestaboard = true;
        console.log('[TIMING] Starting Vestaboard update with birthday:', JSON.stringify(birthday));

        if (!birthday || !birthday.firstName || !birthday.date) {
            throw new Error('Missing birthday first name or date');
        }

        // Create matrix with birthday first name and date
        const matrix = createBirthdayMatrix(birthday.firstName, birthday.date);
        
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

export default async function handler(req, res) {
    // Basic CORS setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Always load birthday from database to ensure we have the latest data
        birthdayCache = await loadBirthday();
    } catch (error) {
        console.error('Failed to load birthday:', error);
        // Continue with empty cache if database access fails
        birthdayCache = null;
    }

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            // Load birthday from database
            const birthday = await loadBirthday();
            
            if (!birthday || !birthday.firstName || !birthday.date) {
                return res.status(400).json({ 
                    error: 'No birthday data found' 
                });
            }
            
            // Create Vestaboard matrix
            const matrix = createBirthdayMatrix(birthday.firstName, birthday.date);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    // Get birthday
    if (req.method === 'GET') {
        try {
            console.log('GET request received, returning birthday:', birthdayCache);
            return res.status(200).json(birthdayCache || { firstName: '', date: '' });
        } catch (error) {
            console.error('Error in GET birthday:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch birthday',
                success: false
            });
        }
    }

    // Save birthday
    if (req.method === 'POST') {
        try {
            // Check if this is just a Vestaboard update request
            if (req.body.updateVestaboardOnly === true) {
                console.log('[TIMING] Received Vestaboard-only update request for birthday at', new Date().toISOString());
                
                // Get the current birthday from the database
                const requestStartTime = new Date();
                const currentBirthday = await loadBirthday();
                console.log(`[TIMING] Database load took ${new Date() - requestStartTime}ms`);
                
                if (!currentBirthday || !currentBirthday.firstName || !currentBirthday.date) {
                    return res.status(400).json({
                        success: false,
                        message: 'No birthday data found to display on Vestaboard'
                    });
                }
                
                // Update Vestaboard with current birthday
                try {
                    console.log('[TIMING] Starting Vestaboard update at', new Date().toISOString());
                    const vestaUpdateStartTime = new Date();
                    const vestaUpdateSuccess = await updateVestaboardWithBirthday(currentBirthday);
                    console.log(`[TIMING] Vestaboard update took ${new Date() - vestaUpdateStartTime}ms`);
                    
                    if (vestaUpdateSuccess) {
                        return res.status(200).json({
                            success: true,
                            message: 'Vestaboard updated successfully with birthday'
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update Vestaboard with birthday'
                        });
                    }
                } catch (vestaError) {
                    console.error('Error updating Vestaboard with birthday:', vestaError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating Vestaboard with birthday'
                    });
                }
            }
            
            // This is a standard update request for birthday
            console.log('Received birthday update:', req.body);
            
            // Validate required fields
            if (!req.body.firstName) {
                return res.status(400).json({
                    success: false,
                    message: 'First name is required'
                });
            }

            if (!req.body.date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required'
                });
            }
            
            // Create birthday object
            const birthday = {
                firstName: req.body.firstName.trim(),
                date: req.body.date.trim()
            };
            
            // Save to the database
            const savedBirthday = await saveBirthday(birthday);
            
            // Update Vestaboard if requested
            let vestaboardUpdateSuccess = false;
            if (req.body.updateVestaboard === true) {
                vestaboardUpdateSuccess = await updateVestaboardWithBirthday(savedBirthday);
            }
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: 'Birthday saved successfully',
                vestaboardUpdated: vestaboardUpdateSuccess,
                birthday: savedBirthday
            });
            
        } catch (error) {
            console.error('Error in POST birthday:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to save birthday',
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
