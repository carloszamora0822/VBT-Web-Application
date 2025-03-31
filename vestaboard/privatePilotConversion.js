/**
 * This file handles converting private pilot data into a format suitable for the Vestaboard display.
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

/**
 * Converts a character to its corresponding Vestaboard code
 * @param {string} char - The character to convert
 * @returns {number} - The Vestaboard code
 */
function charToVestaCode(char) {
  // Convert to uppercase since Vestaboard only has uppercase letters
  const upperChar = char.toUpperCase();
  
  // Return the code if it exists, otherwise return 0 (blank)
  return CHAR_MAP[upperChar] !== undefined ? CHAR_MAP[upperChar] : 0;
}

/**
 * Convert a string to an array of Vestaboard character codes
 * @param {string} str - The string to convert
 * @returns {number[]} - Array of Vestaboard character codes
 */
function stringToVestaCodes(str) {
  return str.split('').map(charToVestaCode);
}

/**
 * Center a string in a fixed width field
 * @param {string} str - The string to center
 * @param {number} width - The width of the field
 * @returns {string} - The centered string
 */
function centerString(str, width) {
  if (str.length >= width) return str.substring(0, width);
  
  const leftPadding = Math.floor((width - str.length) / 2);
  const rightPadding = width - str.length - leftPadding;
  
  return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
}

/**
 * Generate a Vestaboard matrix for displaying the newest private pilot
 * @param {string} pilotName - The name of the newest private pilot
 * @returns {number[][]} - 6x22 matrix of Vestaboard character codes
 */
export function createPrivatePilotMatrix(pilotName) {
  // Create the static matrix template
  const matrix = [
    [67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67],
    [63, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 63],
    [0, 63, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 63, 0],
    [0, 0, 63, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 63, 0, 0],
    [0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0],
    [0, 0, 0, 0, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 0, 0, 0, 0]
  ];
  
  // Process pilot name
  const processedName = pilotName.trim();
  
  // Add centered pilot name to row 1
  const nameCodes = stringToVestaCodes(centerString(processedName, 14));
  for (let i = 0; i < nameCodes.length; i++) {
    matrix[1][i + 4] = nameCodes[i];
  }
  
  // Add "VBT'S" to row 2
  const vbtsText = "VBT'S";
  const vbtsCodes = stringToVestaCodes(centerString(vbtsText, 14));
  for (let i = 0; i < vbtsCodes.length; i++) {
    // Fix apostrophe character - replace code 49 (semicolon) with 52 (apostrophe) 
    if (vbtsCodes[i] === 49) 
      {
      matrix[2][i + 4] = 52;  // Use proper apostrophe code
    } else 
    {
      matrix[2][i + 4] = vbtsCodes[i];
    }
  }
  
  // Add "NEWEST" to row 3
  const newestText = "NEWEST";
  const newestCodes = stringToVestaCodes(centerString(newestText, 14));
  for (let i = 0; i < newestCodes.length; i++) {
    matrix[3][i + 4] = newestCodes[i];
  }
  
  // Add "PRIVATE PILOT" to row 4
  const privatePilotText = "PRIVATE PILOT";
  const privatePilotCodes = stringToVestaCodes(centerString(privatePilotText, 14));
  for (let i = 0; i < privatePilotCodes.length; i++) {
    matrix[4][i + 4] = privatePilotCodes[i];
  }
  
  return matrix;
}
