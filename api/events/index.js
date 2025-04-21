import { createEventMatrix } from '../../vestaboard/eventConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

console.log('[FILE USED] /api/events/index.js');

// In-memory cache for the current request
let eventsCache = [];

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;

/**
 * Load events from the database
 */
async function loadEvents() {
    try {
        console.log('Loading events from MongoDB...');
        const collection = await getCollection('events');
        const events = await collection.find({}).toArray();
        
        console.log(`Loaded ${events.length} events from MongoDB`);
        
        // Transform from MongoDB document to event object
        const eventObjects = events.map(doc => ({
            _id: doc._id,
            date: doc.date || '',
            time: doc.time || '',
            description: doc.description || ''
        }));
        
        // Sort events chronologically - upcoming dates first
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate();
        
        const sortedEvents = eventObjects.sort((a, b) => {
            // Parse the MM/DD format
            const [aMonth, aDay] = a.date.split('/').map(Number);
            const [bMonth, bDay] = b.date.split('/').map(Number);
            
            // Calculate days until next event for each
            let aDaysUntil = calculateDaysUntil(currentMonth, currentDay, aMonth, aDay);
            let bDaysUntil = calculateDaysUntil(currentMonth, currentDay, bMonth, bDay);
            
            // Sort by days until (ascending)
            return aDaysUntil - bDaysUntil;
        });
        
        // Limit to 5 events after sorting
        return sortedEvents.slice(0, 5);
    } catch (error) {
        console.error('Error loading events from MongoDB:', error);
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
 * Save events to the database
 * @param {Array} events The events to save
 */
async function saveEvents(events) {
    try {
        console.log(`Saving ${events.length} events to MongoDB...`);
        
        const collection = await getCollection('events');
        
        // Clear existing events and insert new ones
        await collection.deleteMany({});
        
        if (events.length > 0) {
            await collection.insertMany(events.map(event => ({
                date: event.date || '',
                time: event.time || '',
                description: event.description || '',
                createdAt: new Date()
            })));
        }
        
        console.log(`Saved ${events.length} events to MongoDB`);
        
        // Update the in-memory cache
        eventsCache = [...events];
        return events;
    } catch (error) {
        console.error('Error saving events to MongoDB:', error);
        return eventsCache; // Return cached data on error
    }
}

/**
 * Function to ensure we don't exceed 5 events 
 * @param {Array} events The events array to cap
 * @returns {Array} The capped events array
 */
function capEventsArray(events) {
    if (events.length > 5) {
        console.log(`Capping events array from ${events.length} to 5 items`);
        return events.slice(-5); // Keep the 5 newest events
    }
    return events;
}

/**
 * Update the Vestaboard with the given events
 * @param {Array} events The events to display
 */
async function updateVestaboardWithEvents(events) {
    // If already updating, don't do anything
    if (isUpdatingVestaboard) {
        console.log('Already updating Vestaboard, skipping this update request');
        return;
    }

    try {
        // Set flag to prevent concurrent updates
        isUpdatingVestaboard = true;
        console.log('Starting Vestaboard update with events:', JSON.stringify(events));

        // Create matrix with events
        const matrix = createEventMatrix([...events]);
        
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
        // Always load events from database to ensure we have the latest data
        eventsCache = await loadEvents();
    } catch (error) {
        console.error('Failed to load events:', error);
        // Continue with empty cache if database access fails
        eventsCache = [];
    }

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            // Load events from database
            const events = await loadEvents();
            
            // Create Vestaboard matrix
            const matrix = createEventMatrix(events);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    // Get all events
    if (req.method === 'GET') {
        try {
            console.log('GET request received, returning events:', eventsCache.length);
            return res.status(200).json(eventsCache);
        } catch (error) {
            console.error('Error in GET events:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch events',
                success: false
            });
        }
    }

    // Add new event
    if (req.method === 'POST') {
        try {
            // Check if this is just a Vestaboard update request
            if (req.body.updateVestaboardOnly === true) {
                console.log('Received Vestaboard-only update request');
                
                // Get the current events from the database
                const currentEvents = await loadEvents();
                
                // Update Vestaboard with current events
                try {
                    await updateVestaboardWithEvents(currentEvents);
                } catch (vestaError) {
                    console.error('Vestaboard update error:', vestaError);
                    // Continue even if Vestaboard update fails
                }
                
                return res.status(200).json({
                    success: true,
                    events: currentEvents,
                    message: 'Vestaboard updated successfully'
                });
            }
            
            // Validate request body
            if (!req.body.date || !req.body.description) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Missing required fields: date, description' 
                });
            }
            
            // Enforce character limits
            const newEvent = {
                date: (req.body.date || '').substring(0, 5),         // Limit to 5 characters
                time: (req.body.time || '').substring(0, 4),         // Limit to 4 characters
                description: (req.body.description || '').substring(0, 16)  // Limit to 16 characters
            };
            
            console.log('Adding new event:', newEvent);
            
            // Add to events array
            const updatedEvents = [...eventsCache, newEvent];
            
            // Cap to 5 events
            const capped = capEventsArray(updatedEvents);
            
            // Save to database
            try {
                await saveEvents(capped);
            } catch (dbError) {
                console.error('Database save error:', dbError);
                // Continue with the local changes even if database save fails
            }
            
            // Always update Vestaboard with the events
            try {
                await updateVestaboardWithEvents(capped);
            } catch (vestaError) {
                console.error('Vestaboard update error:', vestaError);
                // Continue even if Vestaboard update fails
            }
            
            return res.status(200).json({
                success: true,
                events: capped
            });
        } catch (error) {
            console.error('Failed to add event:', error);
            return res.status(500).json({ 
                message: 'Failed to add event', 
                success: false,
                error: error.message
            });
        }
    }

    // Delete event
    if (req.method === 'DELETE') {
        try {
            const index = parseInt(req.url.split('/').pop());
            
            if (isNaN(index) || index < 0 || index >= eventsCache.length) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid index'
                });
            }

            const updatedEvents = [...eventsCache];
            const deletedEvent = updatedEvents[index];
            updatedEvents.splice(index, 1);
            console.log('Deleted event at index', index, ':', deletedEvent);
            
            // Save updated events list to database
            try {
                await saveEvents(updatedEvents);
            } catch (dbError) {
                console.error('Database save error on delete:', dbError);
                // Continue with the local changes even if database save fails
            }
            
            // Always update Vestaboard after deletion
            try {
                await updateVestaboardWithEvents(updatedEvents);
            } catch (vestaError) {
                console.error('Vestaboard update error on delete:', vestaError);
                // Continue even if Vestaboard update fails
            }
            
            return res.status(200).json({
                success: true,
                events: updatedEvents
            });
        } catch (error) {
            console.error('Failed to delete event:', error);
            return res.status(500).json({ 
                message: 'Failed to delete event',
                success: false,
                error: error.message
            });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
