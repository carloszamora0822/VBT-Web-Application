const VESTA_CHARS = {
    ' ': 0,
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17,
    'R': 18, 'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25,
    'Z': 26, '0': 36, '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32, '7': 33,
    '8': 34, '9': 35, '!': 37, '@': 38, '#': 39, '$': 40, '(': 41, ')': 42, 
    '+': 43, '-': 44, '&': 45, '=': 46, ';': 47, ':': 48, "'": 49, '"': 50, 
    '%': 51, ',': 52, '.': 53, '/': 59, '?': 60, '°': 62
};

function padString(str, length) {
    return (str + ' '.repeat(length)).slice(0, length);
}

function stringToVestaboard(str) {
    console.log(`Converting string to Vesta codes: "${str}"`);
    const result = str.toUpperCase().split('').map(char => {
        console.log(`Converting '${char}' to code: ${VESTA_CHARS[char] || 0}`);
        return VESTA_CHARS[char] || VESTA_CHARS[' '];
    });
    console.log(`Result: [${result.join(', ')}]`);
    return result;
}

function getFormattedDate() {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
}

function createHeaderRow() {
    const date = getFormattedDate();
    const header = ('CHECKRIDES ' + date).padEnd(22);
    return stringToVestaboard(header);
}

function createFlightRow(flight) {
    // Format with exact spaces for alignment
    const formatted = [
        flight.time.padEnd(5),      // 5 chars
        ' ',                        // 1 space
        flight.callsign.padEnd(7),  // 7 chars
        ' ',                        // 1 space
        flight.type.padEnd(4),      // 4 chars
        ' ',                        // 1 space
        flight.destination.padEnd(3) // 3 chars (remaining space)
    ].join('');

    // Ensure exactly 22 characters
    return stringToVestaboard(formatted.slice(0, 22));
}

export function createVestaMatrix(flights) {
    console.log('Creating flight matrix with flights:', flights);
    
    const matrix = [
        Array(22).fill(0),  // header
        Array(22).fill(0),  // flight 1
        Array(22).fill(0),  // flight 2
        Array(22).fill(0),  // flight 3
        Array(22).fill(0),  // flight 4
        Array(22).fill(0)   // flight 5
    ];

    // add header with VBT name
    const header = `CHECKRIDES ${getFormattedDate()}`.split('').map(char => VESTA_CHARS[char.toUpperCase()] || 0);
    matrix[0] = [...header, ...Array(22 - header.length).fill(0)];
    
    // Sort flights by time
    const sortedFlights = [...flights].sort((a, b) => {
        // Convert time string to minutes for comparison
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return -1; // Handle undefined/empty times
            
            // Parse HH:MM format
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                const hour = parseInt(parts[0], 10);
                const minute = parseInt(parts[1], 10);
                
                if (!isNaN(hour) && !isNaN(minute)) {
                    return hour * 60 + minute;
                }
            }
            
            return -1; // Invalid format
        };
        
        const aTime = timeToMinutes(a.time);
        const bTime = timeToMinutes(b.time);
        
        return aTime - bTime; // Ascending by time
    });

    // Display up to 5 flights
    sortedFlights.slice(0, 5).forEach((flight, index) => {
        // +1 to skip header row
        const rowIndex = index + 1;
        
        // Skip if we exceed the matrix bounds
        if (rowIndex >= 6) return;
        
        // Format with exact character counts for proper alignment:
        // time (4 chars), space, name (6 chars), space, type (3 chars), space, tag (6 chars)
        const timeStr = (flight.time || '').substring(0, 4).padEnd(4); // Exactly 4 chars
        const nameStr = (flight.callsign || '').toUpperCase().substring(0, 6).padEnd(6); // Exactly 6 chars
        const typeStr = (flight.type || '').toUpperCase().substring(0, 3).padEnd(3); // Exactly 3 chars
        const tagStr = (flight.destination || '').toUpperCase().substring(0, 6).padEnd(6); // Exactly 6 chars
        
        // Create the formatted string with consistent spacing
        const formattedStr = `${timeStr} ${nameStr} ${typeStr} ${tagStr}`;
        
        // Convert to Vestaboard character codes
        const row = formattedStr.split('').map(c => VESTA_CHARS[c] || 0);
        
        // Ensure row is exactly 22 characters
        if (row.length < 22) {
            matrix[rowIndex] = [...row, ...Array(22 - row.length).fill(0)];
        } else {
            matrix[rowIndex] = row.slice(0, 22);
        }
    });

    console.log('Created flight matrix:', JSON.stringify(matrix));
    return matrix;
}
