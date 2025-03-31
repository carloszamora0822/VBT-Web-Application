/**
 * This file handles converting employee recognition data into a format suitable for the Vestaboard display.
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
 * Generate a Vestaboard matrix for displaying employee recognition
 * @param {string} firstName - The first name of the employee to recognize
 * @param {string} lastName - The last name of the employee to recognize
 * @returns {number[][]} - 6x22 matrix of Vestaboard character codes
 */
export function createEmployeeRecognitionMatrix(firstName, lastName) {
  // Create the static template matrix with the specific pattern
  const matrix = [
    [0, 63, 0, 67, 0, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67],
    [0, 0, 67, 63, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67],
    [67, 67, 63, 69, 63, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67],
    [0, 0, 67, 63, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67],
    [0, 63, 0, 67, 0, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 67]
  ];
  
  // Process employee names
  const processedFirstName = firstName.trim();
  const processedLastName = lastName.trim();
  
  // Add RECOGNIZE text to row 0
  const recognizeText = 'RECOGNIZE';
  const recognizeCodes = stringToVestaCodes(recognizeText);
  for (let i = 0; i < recognizeCodes.length; i++) {
    matrix[0][i + 7] = recognizeCodes[i];
  }
  
  // Row 1 - Add first name after the blue, red, blue pattern (67, 63, 67)
  // The pattern is already set in the matrix template
  const firstNameCodes = stringToVestaCodes(processedFirstName);
  const firstNameStartPos = 7; // Starting after the pattern
  for (let i = 0; i < firstNameCodes.length; i++) {
    if (i + firstNameStartPos < 19) { // Leave room for the ending colors
      matrix[1][i + firstNameStartPos] = firstNameCodes[i];
    }
  }
  
  // Row 2 - Add last name
  const lastNameCodes = stringToVestaCodes(centerString(processedLastName, 12));
  for (let i = 0; i < lastNameCodes.length; i++) {
    if (i + 7 < 19) { // Leave room for the ending colors
      matrix[2][i + 7] = lastNameCodes[i];
    }
  }
  
  // Add FOR ALWAYS text to row 3
  const forAlwaysText = 'FOR ALWAYS';
  const forAlwaysCodes = stringToVestaCodes(forAlwaysText);
  for (let i = 0; i < forAlwaysCodes.length; i++) {
    matrix[3][i + 7] = forAlwaysCodes[i];
  }
  
  // Add GOING THE text to row 4
  const goingTheText = 'GOING THE';
  const goingTheCodes = stringToVestaCodes(goingTheText);
  for (let i = 0; i < goingTheCodes.length; i++) {
    matrix[4][i + 7] = goingTheCodes[i];
  }
  
  // Add EXTRA MILE text to row 5
  const extraMileText = 'EXTRA MILE';
  const extraMileCodes = stringToVestaCodes(extraMileText);
  for (let i = 0; i < extraMileCodes.length; i++) {
    matrix[5][i + 7] = extraMileCodes[i];
  }
  
  return matrix;
}
