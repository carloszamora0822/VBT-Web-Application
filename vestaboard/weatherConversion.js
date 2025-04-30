// Weather Conversion Logic for Vestaboard Matrix
// Consistent with existing conversion modules (e.g., birthdayConversion.js)
// Use native fetch (Node.js 18+) - no import needed

const VESTABOARD_CHAR_CODES = {
  "0": 36, "1": 27, "2": 28, "3": 29, "4": 30,
  "5": 31, "6": 32, "7": 33, "8": 34, "9": 35,
  "°": 62, "F": 6
};

// Helper to convert a string (e.g., "72°F") to an array of Vestaboard codes
function stringToVestaboardCodes(str) {
  return [...str].map(char => VESTABOARD_CHAR_CODES[char] ?? 0);
}

function padOrTruncate(arr, len, padValue = 0) {
  if (!Array.isArray(arr)) arr = [];
  if (arr.length > len) return arr.slice(0, len);
  if (arr.length < len) return arr.concat(Array(len - arr.length).fill(padValue));
  return arr;
}

function insertAt(row, insertArr, index) {
  // row: base array (length 22)
  // insertArr: array to insert
  // index: where to insert
  const before = row.slice(0, index);
  const after = row.slice(index + insertArr.length);
  return before.concat(insertArr, after);
}

export async function fetchWeatherData() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const location = process.env.OPENWEATHER_LOCATION || 'Bentonville,US';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  const data = await response.json();
  const temperature = Math.round(data.main.temp);
  const wind = Math.round(data.wind.speed);
  const tempString = `${temperature}°F`;
  const windString = `${wind}`;
  const description = data.weather[0].main;
  return {
    temperatureArray: stringToVestaboardCodes(tempString),
    windArray: stringToVestaboardCodes(windString),
    description
  };
}

// Returns the correct matrix for the weather condition, inserting temp/wind arrays
export async function getWeatherMatrix() {
  try {
    const { temperatureArray, windArray, description } = await fetchWeatherData();
    const tempArr = padOrTruncate(temperatureArray, 8);
    const windArr = padOrTruncate(windArray, 6);
    if (description.toLowerCase().includes('clear')) {
      let matrix = [
        Array(22).fill(0),
        [0,0,65,65,65,64,64,64,64,65,65,65,0,0,0,19,21,14,14,25,0,0],
        Array(22).fill(0),
        Array(22).fill(0),
        [0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0],
        [0,0,0,0,2,5,14,20,15,14,20,9,12,12,5,55,1,18,0,0,0,0]
      ];
      // Insert tempArr into row 2 at index 14
      matrix[2] = insertAt(Array(22).fill(0), tempArr, 14);
      // Insert windArr into row 3 at index 14
      matrix[3] = insertAt(Array(22).fill(0), windArr, 14);
      return matrix.map(row => padOrTruncate(row, 22));
    }
    if (description.toLowerCase().includes('clouds')) {
      let matrix = [
        Array(22).fill(0),
        [3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0],
        Array(22).fill(0),
        Array(22).fill(0),
        [11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69]
      ];
      matrix[2] = insertAt(Array(22).fill(0), tempArr, 2); // Insert tempArr at index 2
      matrix[3] = insertAt(Array(22).fill(0), windArr, 2); // Insert windArr at index 2
      return matrix.map(row => padOrTruncate(row, 22));
    }
    if (description.toLowerCase().includes('rain')) {
      let matrix = [
        Array(22).fill(0),
        [3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0],
        Array(22).fill(0),
        Array(22).fill(0),
        [11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69]
      ];
      matrix[2] = insertAt(Array(22).fill(0), tempArr, 2);
      matrix[3] = insertAt(Array(22).fill(0), windArr, 2);
      return matrix.map(row => padOrTruncate(row, 22));
    }
    // Default fallback
    let matrix = [
      Array(22).fill(0),
      [0,0,0,0,0,23,5,1,20,8,5,18,0,0,0,0,0,0,0,0,0,0],
      Array(22).fill(0),
      Array(22).fill(0),
      [0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0],
      [0,0,0,0,2,5,14,20,15,14,22,9,12,12,5,55,1,18,0,0,0,0]
    ];
    matrix[2] = insertAt(Array(22).fill(0), tempArr, 2);
    matrix[2] = insertAt(matrix[2], windArr, 12); // Insert windArr after tempArr
    return matrix.map(row => padOrTruncate(row, 22));
  } catch (error) {
    console.error('[WeatherMatrixError]', error);
    const errorRow = padOrTruncate(stringToVestaboardCodes('WEATHER ERROR'), 22, 0);
    return [errorRow, ...Array(5).fill(padOrTruncate([], 22, 0))];
  }
}
