/**
 * This file handles converting event data into a format suitable for the Vestaboard display.
 * The Vestaboard has 6 rows and 22 columns, and uses special character codes.
 */

// Character map for Vestaboard
// 0 for blank, 1-26 for A-Z, 27-36 for 0-9, then special characters
const CHAR_MAP = {
  ' ': 0,
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 
  'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18, 
  'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26, 
  '0': 36, '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32, '7': 33, '8': 34, '9': 35,
  '!': 37, '@': 38, '#': 39, '$': 40, '(': 41, ')': 42, '+': 43, '-': 44, 
  '&': 45, '=': 46, ';': 47, ':': 48, "'": 49, '"': 50, '%': 51, ',': 52, 
  '.': 53, '/': 59, '?': 60, '°': 62
};

// Create a 6x22 matrix filled with spaces (code 0)
function createEmptyMatrix() {
  return Array(6).fill().map(() => Array(22).fill(0));
}

/**
 * Converts a character to its corresponding Vestaboard code
 * @param {string} char - The character to convert
 * @returns {number} - The Vestaboard code
 */
function charToVestaCode(char) {
  // Convert to uppercase since Vestaboard only has uppercase letters
  const upperChar = char.toUpperCase();
  
  // Return the code if it exists, otherwise return 0 (blank)
  console.log(`Converting '${char}' to code: ${CHAR_MAP[upperChar] !== undefined ? CHAR_MAP[upperChar] : 0}`);
  return CHAR_MAP[upperChar] !== undefined ? CHAR_MAP[upperChar] : 0;
}

/**
 * Convert a string to an array of Vestaboard character codes
 * @param {string} str - The string to convert
 * @returns {number[]} - Array of Vestaboard character codes
 */
function stringToVestaCodes(str) {
  console.log(`Converting string to Vesta codes: "${str}"`);
  const result = str.split('').map(charToVestaCode);
  console.log(`Result: [${result.join(', ')}]`);
  return result;
}

/**
 * Generate a Vestaboard matrix for displaying events
 * @param {Array} events - Array of event objects with date, time, and description
 * @returns {number[][]} - 6x22 matrix of Vestaboard character codes
 */
export function createEventMatrix(events) {
  console.log('Creating event matrix with events:', events);
  
  // Create empty matrix
  const matrix = createEmptyMatrix();
  
  // Add title with "UPCOMING EVENTS"
  const titleCodes = stringToVestaCodes('UPCOMING FLY OZ EVENTS');
  for (let i = 0; i < titleCodes.length; i++) {
    if (i < 22) matrix[0][i] = titleCodes[i];
  }
  
  // Sort events by date (MM/DD format)
  const sortedEvents = [...events].sort((a, b) => {
    // Parse dates (MM/DD format)
    const [aMonth, aDay] = (a.date || '').split('/').map(Number);
    const [bMonth, bDay] = (b.date || '').split('/').map(Number);
    
    // Compare months first
    if (aMonth !== bMonth) {
      return aMonth - bMonth;
    }
    
    // If months are the same, compare days
    return aDay - bDay;
  });
  
  // Add events (up to 5)
  const eventsToShow = sortedEvents.slice(0, 5);
  for (let i = 0; i < eventsToShow.length; i++) {
    const event = eventsToShow[i];
    const rowIndex = i + 1; // Start at row 1 (0-indexed) right after header
    
    if (rowIndex >= 6) break; // Don't exceed the matrix bounds
    
    // Ensure date is max 5 characters
    const dateStr = (event.date || '').substring(0, 5).padEnd(5, ' ');
    // Limit description to 16 characters
    const descStr = (event.description || '').substring(0, 16).padEnd(16, ' ');
    
    // Format event line: "MM/DD [description]"
    let eventLine = `${dateStr} ${descStr}`;
    eventLine = eventLine.substring(0, 22); // Ensure it fits
    
    console.log(`Formatting event line: "${eventLine}"`);
    
    const eventCodes = stringToVestaCodes(eventLine);
    for (let j = 0; j < eventCodes.length; j++) {
      if (j < 22) matrix[rowIndex][j] = eventCodes[j];
    }
  }
  
  console.log('Created event matrix:', JSON.stringify(matrix));
  return matrix;
}
