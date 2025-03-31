import { connectToDatabase } from '../../lib/mongodb';
import { createFlightMatrix } from '../../vestaboard/flightConversion';
import { createEventMatrix } from '../../vestaboard/eventConversion';
import { updateVestaboard } from '../../vestaboard/vestaboardApi';

// A special API key for Power Automate integration
const POWER_AUTOMATE_API_KEY = process.env.POWER_AUTOMATE_API_KEY || 'set-your-api-key-here';

/**
 * Handles insertion of data from Power Automate into the application
 * Authentication is done via API key
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,x-api-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    // Validate API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== POWER_AUTOMATE_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid API key'
        });
    }

    try {
        // Connect to database
        const { db } = await connectToDatabase();
        
        // Check what type of data we're adding
        const { type, data } = req.body;
        
        if (!type || !data) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, data'
            });
        }

        // Handle flight data
        if (type === 'flight') {
            if (!data.time || !data.callsign || !data.destination) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required flight fields: time, callsign, destination'
                });
            }

            const newFlight = {
                time: data.time.substring(0, 4),      // Limit to 4 characters
                callsign: data.callsign.substring(0, 6),  // Limit to 6 characters
                type: data.type || 'PPL',
                destination: data.destination.substring(0, 6)  // Limit to 6 characters
            };

            // Get existing flights
            const flights = await db.collection('flights').find({}).toArray();
            
            // Add new flight and cap to 5
            const updatedFlights = [...flights, newFlight]
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(-5);
            
            // Update database - clear previous flights and insert new set
            await db.collection('flights').deleteMany({});
            await db.collection('flights').insertMany(updatedFlights);
            
            // Update Vestaboard
            const matrix = createFlightMatrix(updatedFlights);
            await updateVestaboard(matrix);
            
            return res.status(200).json({
                success: true,
                message: 'Flight added successfully and Vestaboard updated',
                flights: updatedFlights
            });
        }
        
        // Handle event data
        else if (type === 'event') {
            if (!data.date || !data.time || !data.description) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required event fields: date, time, description'
                });
            }

            const newEvent = {
                date: data.date.substring(0, 5),        // Limit to 5 characters
                time: data.time.substring(0, 4),        // Limit to 4 characters
                description: data.description.substring(0, 10)  // Limit to 10 characters
            };

            // Get existing events
            const events = await db.collection('events').find({}).toArray();
            
            // Add new event and cap to 5
            const updatedEvents = [...events, newEvent]
                .sort((a, b) => {
                    const dateComparison = a.date.localeCompare(b.date);
                    return dateComparison !== 0 ? dateComparison : a.time.localeCompare(b.time);
                })
                .slice(-5);
            
            // Update database - clear previous events and insert new set
            await db.collection('events').deleteMany({});
            await db.collection('events').insertMany(updatedEvents);
            
            // Update Vestaboard
            const matrix = createEventMatrix(updatedEvents);
            await updateVestaboard(matrix);
            
            return res.status(200).json({
                success: true,
                message: 'Event added successfully and Vestaboard updated',
                events: updatedEvents
            });
        }
        
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be either "flight" or "event"'
            });
        }
    } catch (error) {
        console.error('Power Automate integration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error processing Power Automate request',
            error: error.message
        });
    }
}
