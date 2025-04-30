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
    // Defensive: always pad/truncate arrays so rows are exactly 22
    const tempArr = padOrTruncate(temperatureArray, 8); // e.g., 8 chars for temp
    const windArr = padOrTruncate(windArray, 6); // e.g., 6 chars for wind
    // Matrix templates
    if (description.toLowerCase().includes('clear')) {
      const matrix = [
        padOrTruncate([0,0,0,0,65,65,65,65,65,65,0,0,0,0,0,0,0,0,0,0,0,0], 22),
        padOrTruncate([0,0,65,65,65,64,64,64,64,65,65,65,0,0,0,19,21,14,14,25,0,0], 22),
        padOrTruncate([0,65,65,64,64,64,63,63,64,64,64,65,65,0,0, ...tempArr, 4,5,7,0,0], 22),
        padOrTruncate([65,65,64,64,63,63,63,63,63,63,64,64,65,65,0, ...windArr, 13,16,8,0,0], 22),
        padOrTruncate([0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0], 22),
        padOrTruncate([0,0,0,0,2,5,14,20,15,14,20,9,12,12,5,55,1,18,0,0,0,0], 22)
      ];
      return matrix;
    }
    if (description.toLowerCase().includes('clouds')) {
      const matrix = [
        padOrTruncate([0,0,0,0,0,0,0,0,69,69,69,69,0,0,0,0,0,0,0,0,0,0], 22),
        padOrTruncate([3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0], 22),
        padOrTruncate([...tempArr, 4,5,7,0,0,0,0,0,0,0,0,0,69,69,69,69,69,69,69,0], 22),
        padOrTruncate([...windArr, 13,16,8,0,0,69,69,69,69,69,69,69,69,0,0,0,0,0,0,0,0], 22),
        padOrTruncate([11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0], 22),
        padOrTruncate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69], 22)
      ];
      return matrix;
    }
    if (description.toLowerCase().includes('rain')) {
      const matrix = [
        padOrTruncate([0,0,0,0,0,0,0,0,69,69,69,69,0,0,0,0,0,0,0,0,0,0], 22),
        padOrTruncate([3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0], 22),
        padOrTruncate([...tempArr, 4,5,7,0,0,0,0,0,0,0,0,0,69,69,69,69,69,69,69,0], 22),
        padOrTruncate([...windArr, 13,16,8,0,0,69,69,69,69,69,69,69,69,0,0,0,0,0,0,0,0], 22),
        padOrTruncate([11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0], 22),
        padOrTruncate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69], 22)
      ];
      return matrix;
    }
    // Default fallback
    const matrix = [
      padOrTruncate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 22),
      padOrTruncate([0,0,0,0,0,23,5,1,20,8,5,18,0,0,0,0,0,0,0,0,0,0], 22),
      padOrTruncate([0,0, ...tempArr, 62,6,0,0,23,9,14,4,28, ...windArr, 0,13,16,8,0,0,0], 22),
      padOrTruncate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 22),
      padOrTruncate([0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0], 22),
      padOrTruncate([0,0,0,0,2,5,14,20,15,14,22,9,12,12,5,55,1,18,0,0,0,0], 22)
    ];
    return matrix;
  } catch (error) {
    // Log error for debugging
    console.error('[WeatherMatrixError]', error);
    // Return a fallback matrix with an error message
    const errorRow = padOrTruncate(stringToVestaboardCodes('WEATHER ERROR'), 22, 0);
    return [errorRow, ...Array(5).fill(padOrTruncate([], 22, 0))];
  }
}
