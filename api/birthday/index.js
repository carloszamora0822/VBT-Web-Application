import { createBirthdayMatrix } from '../../vestaboard/birthdayConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

console.log('[FILE USED] /api/birthday/index.js');

// In-memory cache for the current request
let birthdaysCache = [];

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;

/**
 * Format today's date as MM/DD
 * @returns {string} Today's date in MM/DD format
 */
function getTodayFormatted() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${month}/${day}`;
}

/**
 * Check if any of the stored birthdays is today
 * @param {Array} birthdays Array of birthday objects
 * @returns {Object|null} Birthday object if found, null otherwise
 */
function findTodaysBirthday(birthdays) {
    const today = getTodayFormatted();
    console.log(`Checking for birthdays on ${today}...`);
    
    return birthdays.find(birthday => birthday.date === today) || null;
}

/**
 * Load birthdays from the database
 */
async function loadBirthdays() {
    try {
        console.log('Loading birthdays from MongoDB...');
        const collection = await getCollection('birthdays');
        const birthdays = await collection.find({}).toArray();
        
        console.log(`Loaded ${birthdays.length} birthdays from MongoDB`);
        
        // Transform from MongoDB document to birthday objects
        const birthdayObjects = birthdays.map(doc => ({
            _id: doc._id,
            firstName: doc.firstName || '',
            date: doc.date || ''
        }));
        
        // Sort birthdays chronologically - upcoming dates first
        // For this we need to calculate days until next occurrence of each birthday
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate();
        
        return birthdayObjects.sort((a, b) => {
            // Parse the MM/DD format
            const [aMonth, aDay] = a.date.split('/').map(Number);
            const [bMonth, bDay] = b.date.split('/').map(Number);
            
            // Calculate days until next birthday for each
            let aDaysUntil = calculateDaysUntil(currentMonth, currentDay, aMonth, aDay);
            let bDaysUntil = calculateDaysUntil(currentMonth, currentDay, bMonth, bDay);
            
            // Sort by days until (ascending)
            return aDaysUntil - bDaysUntil;
        });
    } catch (error) {
        console.error('Error loading birthdays from MongoDB:', error);
        return []; // Return empty array on error
    }
}

/**
 * Calculate days until the next occurrence of a month/day
 * @param {number} currentMonth Current month (1-12)
 * @param {number} currentDay Current day (1-31)
 * @param {number} targetMonth Target month (1-12)
 * @param {number} targetDay Target day (1-31)
 * @returns {number} Days until next occurrence
 */
function calculateDaysUntil(currentMonth, currentDay, targetMonth, targetDay) {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), targetMonth - 1, targetDay);
    
    // If the date has already occurred this year, use next year's date
    if (targetMonth < currentMonth || (targetMonth === currentMonth && targetDay < currentDay)) {
        targetDate.setFullYear(today.getFullYear() + 1);
    }
    
    // Calculate the difference in days
    const differenceMs = targetDate - today;
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
}

/**
 * Save birthday to the database
 * @param {Object} birthday The birthday record to save
 */
async function saveBirthday(birthday) {
    try {
        console.log(`Saving birthday to MongoDB:`, birthday);
        
        const collection = await getCollection('birthdays');
        
        // Add the new birthday
        if (birthday && birthday.firstName && birthday.date) {
            await collection.insertOne({
                firstName: birthday.firstName,
                date: birthday.date,
                createdAt: new Date()
            });
            
            // Refresh the cache
            birthdaysCache = await loadBirthdays();
        }
        
        console.log(`Saved birthday to MongoDB, total birthdays: ${birthdaysCache.length}`);
        
        return birthday;
    } catch (error) {
        console.error('Error saving birthday to MongoDB:', error);
        return null;
    }
}

/**
 * Remove a birthday from the database
 * @param {string} id The ID of the birthday to remove
 */
async function deleteBirthday(id) {
    try {
        console.log(`Deleting birthday with ID: ${id}`);
        
        const collection = await getCollection('birthdays');
        
        // Import ObjectId from mongodb for proper ID conversion
        const { ObjectId } = require('mongodb');
        
        // Convert string ID to MongoDB ObjectId
        const objectId = new ObjectId(id);
        
        // Delete the birthday by its ID
        await collection.deleteOne({ _id: objectId });
        
        console.log(`Deleted birthday with ID: ${id}`);
        
        // Refresh the cache
        birthdaysCache = await loadBirthdays();
        
        console.log(`Deleted birthday, remaining birthdays: ${birthdaysCache.length}`);
        
        return true;
    } catch (error) {
        console.error('Error deleting birthday from MongoDB:', error);
        return false;
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
        console.log('Starting Vestaboard update with birthday:', JSON.stringify(birthday));

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
        // Always load birthdays from database to ensure we have the latest data
        birthdaysCache = await loadBirthdays();
    } catch (error) {
        console.error('Failed to load birthdays:', error);
        // Continue with empty cache if database access fails
        birthdaysCache = [];
    }

    // Check if any of the stored birthdays is today
    const todaysBirthday = findTodaysBirthday(birthdaysCache);
    const isBirthdayToday = !!todaysBirthday;
    console.log(`Is there a birthday today? ${isBirthdayToday ? 'YES' : 'NO'}`);

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            if (!isBirthdayToday) {
                return res.status(404).json({ 
                    error: 'No birthday today' 
                });
            }
            
            // Create Vestaboard matrix for today's birthday
            const matrix = createBirthdayMatrix(todaysBirthday.firstName, todaysBirthday.date);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    // Get all birthdays or today's birthday info
    if (req.method === 'GET') {
        try {
            if (req.query.today === 'true') {
                // Return just today's birthday if requested
                console.log('GET request received for today\'s birthday');
                return res.status(200).json({
                    isBirthdayToday,
                    birthday: todaysBirthday,
                    count: birthdaysCache.length
                });
            } else {
                // Return all birthdays by default
                console.log('GET request received, returning all birthdays:', birthdaysCache.length);
                return res.status(200).json(birthdaysCache);
            }
        } catch (error) {
            console.error('Error in GET birthdays:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch birthdays',
                success: false
            });
        }
    }

    // Add new birthday
    if (req.method === 'POST') {
        try {
            // Check if this is just a Vestaboard update request
            if (req.body.updateVestaboardOnly === true) {
                console.log('Received Vestaboard-only update request for birthday');
                
                if (!isBirthdayToday) {
                    return res.status(404).json({
                        success: false,
                        message: 'No birthday today to display on Vestaboard'
                    });
                }
                
                // Update Vestaboard with today's birthday
                try {
                    const vestaUpdateSuccess = await updateVestaboardWithBirthday(todaysBirthday);
                    
                    if (vestaUpdateSuccess) {
                        return res.status(200).json({
                            success: true,
                            message: 'Vestaboard updated successfully with today\'s birthday'
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
            
            // This is a standard request to add a birthday
            console.log('Received birthday addition request:', req.body);
            
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
            
            // Check if the newly added birthday is today
            const newBirthdayIsToday = savedBirthday && savedBirthday.date === getTodayFormatted();
            
            // Update Vestaboard if requested and it's a birthday today
            let vestaboardUpdateSuccess = false;
            if (req.body.updateVestaboard === true && newBirthdayIsToday) {
                vestaboardUpdateSuccess = await updateVestaboardWithBirthday(savedBirthday);
            }
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: 'Birthday saved successfully',
                vestaboardUpdated: vestaboardUpdateSuccess,
                birthday: savedBirthday,
                birthdays: birthdaysCache
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

    // Delete birthday
    if (req.method === 'DELETE') {
        try {
            const id = req.query.id;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Birthday ID is required'
                });
            }
            
            const success = await deleteBirthday(id);
            
            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Birthday deleted successfully',
                    birthdays: birthdaysCache
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete birthday'
                });
            }
        } catch (error) {
            console.error('Error in DELETE birthday:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete birthday',
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
