/**
 * This file handles converting birthday data into a format suitable for the Vestaboard display.
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
 * Generate a Vestaboard matrix for displaying birthday information
 * @param {string} firstName - The first name of the person having a birthday
 * @param {string} date - The date of the birthday
 * @returns {number[][]} - 6x22 matrix of Vestaboard character codes
 */
export function createBirthdayMatrix(firstName, date) {
  // Create the static template matrix with a decorative border
  const matrix = [
    [63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63],
    [63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63],
    [63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63],
    [63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63],
    [63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63],
    [63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63, 63]
  ];
  
  // Process first name and date
  const processedFirstName = firstName.trim();
  const processedDate = date.trim();
  
  // Add "HAPPY BIRTHDAY" text to row 1
  const happyText = "HAPPY BIRTHDAY";
  const happyCodes = stringToVestaCodes(centerString(happyText, 20));
  for (let i = 0; i < happyCodes.length; i++) {
    matrix[1][i + 1] = happyCodes[i];
  }
  
  // Add first name to row 2
  const nameCodes = stringToVestaCodes(centerString(processedFirstName, 20));
  for (let i = 0; i < nameCodes.length; i++) {
    matrix[2][i + 1] = nameCodes[i];
  }
  
  // Add "LETS CELEBRATE!" text to row 3
  const celebrateText = "LETS CELEBRATE!";
  const celebrateCodes = stringToVestaCodes(centerString(celebrateText, 20));
  for (let i = 0; i < celebrateCodes.length; i++) {
    matrix[3][i + 1] = celebrateCodes[i];
  }
  
  // Add date to row 4
  const dateCodes = stringToVestaCodes(centerString(processedDate, 20));
  for (let i = 0; i < dateCodes.length; i++) {
    matrix[4][i + 1] = dateCodes[i];
  }
  
  return matrix;
}
