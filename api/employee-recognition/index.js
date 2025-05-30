import { createEmployeeRecognitionMatrix } from '../../vestaboard/employeeRecognitionConversion';
import { updateVestaboard } from '../../vestaboard/vestaboard';
import { getCollection } from '../../lib/mongodb';

console.log('[FILE USED] /api/employee-recognition/index.js');

// In-memory cache for the current request
let employeeCache = null;

// Flag to track if we're currently updating the Vestaboard
let isUpdatingVestaboard = false;

/**
 * Load employee recognition from the database
 */
async function loadEmployeeRecognition() {
    try {
        console.log('Loading employee recognition from MongoDB...');
        const collection = await getCollection('employeeRecognition');
        const record = await collection.findOne({}, { sort: { _id: -1 } });
        
        console.log(`Loaded employee recognition from MongoDB:`, record);
        
        // Return the record if found, or null if not
        return record ? {
            firstName: record.firstName || '',
            lastName: record.lastName || ''
        } : null;
    } catch (error) {
        console.error('Error loading employee recognition from MongoDB:', error);
        return null; // Return null on error
    }
}

/**
 * Save employee recognition to the database
 * @param {Object} employee The employee recognition record to save
 */
async function saveEmployeeRecognition(employee) {
    try {
        console.log(`Saving employee recognition to MongoDB:`, employee);
        
        const collection = await getCollection('employeeRecognition');
        
        // Clear existing record and insert new one
        await collection.deleteMany({});
        
        if (employee && employee.firstName && employee.lastName) {
            await collection.insertOne({
                firstName: employee.firstName,
                lastName: employee.lastName,
                createdAt: new Date()
            });
        }
        
        console.log(`Saved employee recognition to MongoDB`);
        
        // Update the in-memory cache
        employeeCache = { ...employee };
        return employee;
    } catch (error) {
        console.error('Error saving employee recognition to MongoDB:', error);
        return employeeCache; // Return cached data on error
    }
}

/**
 * Update the Vestaboard with the employee recognition
 * @param {Object} employee The employee to recognize
 */
async function updateVestaboardWithEmployee(employee) {
    // If already updating, don't do anything
    if (isUpdatingVestaboard) {
        console.log('Already updating Vestaboard, skipping this update request');
        return;
    }

    try {
        // Set flag to prevent concurrent updates
        isUpdatingVestaboard = true;
        console.log('Starting Vestaboard update with employee recognition:', JSON.stringify(employee));

        if (!employee || !employee.firstName || !employee.lastName) {
            throw new Error('Missing employee first or last name for recognition');
        }

        // Create matrix with employee first and last name
        const matrix = createEmployeeRecognitionMatrix(employee.firstName, employee.lastName);
        
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
        // Always load employee recognition from database to ensure we have the latest data
        employeeCache = await loadEmployeeRecognition();
    } catch (error) {
        console.error('Failed to load employee recognition:', error);
        // Continue with empty cache if database access fails
        employeeCache = null;
    }

    // Check if this is a vestaboard matrix request
    if (req.query.format === 'vestaboard') {
        try {
            // Load employee recognition from database
            const employee = await loadEmployeeRecognition();
            
            if (!employee || !employee.firstName || !employee.lastName) {
                return res.status(400).json({ 
                    error: 'No employee recognition data found' 
                });
            }
            
            // Create Vestaboard matrix
            const matrix = createEmployeeRecognitionMatrix(employee.firstName, employee.lastName);
            
            // Return the matrix
            return res.status(200).json(matrix);
        } catch (error) {
            console.error('Error generating Vestaboard matrix:', error);
            return res.status(500).json({ 
                error: 'Failed to generate Vestaboard matrix'
            });
        }
    }

    // Get employee recognition
    if (req.method === 'GET') {
        try {
            console.log('GET request received, returning employee recognition:', employeeCache);
            return res.status(200).json(employeeCache || { firstName: '', lastName: '' });
        } catch (error) {
            console.error('Error in GET employee recognition:', error);
            return res.status(500).json({ 
                message: 'Failed to fetch employee recognition',
                success: false
            });
        }
    }

    // Save employee recognition
    if (req.method === 'POST') {
        try {
            // Check if this is just a Vestaboard update request
            if (req.body.updateVestaboardOnly === true) {
                console.log('Received Vestaboard-only update request for employee recognition');
                
                // Get the current employee recognition from the database
                const currentEmployee = await loadEmployeeRecognition();
                
                if (!currentEmployee || !currentEmployee.firstName || !currentEmployee.lastName) {
                    return res.status(400).json({
                        success: false,
                        message: 'No employee recognition data found to display on Vestaboard'
                    });
                }
                
                // Update Vestaboard with current employee recognition
                try {
                    const vestaUpdateSuccess = await updateVestaboardWithEmployee(currentEmployee);
                    
                    if (vestaUpdateSuccess) {
                        return res.status(200).json({
                            success: true,
                            message: 'Vestaboard updated successfully with employee recognition'
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update Vestaboard with employee recognition'
                        });
                    }
                } catch (vestaError) {
                    console.error('Error updating Vestaboard with employee recognition:', vestaError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating Vestaboard with employee recognition'
                    });
                }
            }
            
            // This is a standard update request for employee recognition
            console.log('Received employee recognition update:', req.body);
            
            // Validate required fields
            if (!req.body.firstName) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee first name is required'
                });
            }

            if (!req.body.lastName) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee last name is required'
                });
            }
            
            // Create employee recognition object
            const employee = {
                firstName: req.body.firstName.trim(),
                lastName: req.body.lastName.trim()
            };
            
            // Save to the database
            const savedEmployee = await saveEmployeeRecognition(employee);
            
            // Update Vestaboard if requested
            let vestaboardUpdateSuccess = false;
            if (req.body.updateVestaboard === true) {
                vestaboardUpdateSuccess = await updateVestaboardWithEmployee(savedEmployee);
            }
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: 'Employee recognition saved successfully',
                vestaboardUpdated: vestaboardUpdateSuccess,
                employee: savedEmployee
            });
            
        } catch (error) {
            console.error('Error in POST employee recognition:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to save employee recognition',
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
