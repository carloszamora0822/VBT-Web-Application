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
  console.log('[stringToVestaboardCodes] input:', str);
  const codes = [...str].map(char => VESTABOARD_CHAR_CODES[char] ?? 0);
  console.log('[stringToVestaboardCodes] output:', codes);
  return codes;
}

function padOrTruncate(arr, len, padValue = 0) {
  console.log('[padOrTruncate] input:', arr, 'len:', len);
  if (!Array.isArray(arr)) arr = [];
  let result;
  if (arr.length > len) result = arr.slice(0, len);
  else if (arr.length < len) result = arr.concat(Array(len - arr.length).fill(padValue));
  else result = arr;
  console.log('[padOrTruncate] output:', result);
  return result;
}

function insertAt(row, insertArr, index) {
  console.log('[insertAt] row:', row, 'insertArr:', insertArr, 'index:', index);
  const before = row.slice(0, index);
  const after = row.slice(index + insertArr.length);
  const result = before.concat(insertArr, after);
  console.log('[insertAt] output:', result);
  return result;
}

// Helper: Replace first pair of placeholder (default 36) with replacementArr
function replaceFirstPair(row, replacementArr, placeholder = 36) {
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] === placeholder && row[i + 1] === placeholder) {
      if (replacementArr.length === 1) {
        // Only replace the second placeholder for right-align
        row[i + 1] = replacementArr[0];
      } else {
        // Replace both (or as many as fit)
        for (let j = 0; j < replacementArr.length && i + j < row.length; j++) {
          row[i + j] = replacementArr[j];
        }
      }
      break;
    }
  }
  return row;
}

export async function fetchWeatherData() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const location = process.env.OPENWEATHER_LOCATION || 'Bentonville,US';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${apiKey}`;
  console.log('[fetchWeatherData] url:', url);
  const response = await fetch(url);
  console.log('[fetchWeatherData] response.ok:', response.ok, 'status:', response.status);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  const data = await response.json();
  console.log('[fetchWeatherData] data:', data);
  const temperature = Math.round(data.main.temp);
  const wind = Math.round(data.wind.speed);
  const tempString = `${temperature}°F`;
  const windString = `${wind}`;
  const description = data.weather[0].main;
  console.log('[fetchWeatherData] tempString:', tempString, 'windString:', windString, 'description:', description);
  return {
    temperatureArray: stringToVestaboardCodes(tempString),
    windArray: stringToVestaboardCodes(windString),
    description
  };
}

export async function getWeatherMatrix() {
  try {
    const { temperatureArray, windArray, description } = await fetchWeatherData();
    console.log('[getWeatherMatrix] temperatureArray:', temperatureArray, 'windArray:', windArray, 'description:', description);
    const tempArr = temperatureArray;
    const windArr = windArray;
    // Weather templates (using 36 as the placeholder)
    const cloudyTemplate = [
      [0, 0, 0, 0, 0, 0, 0, 0, 69, 69, 69, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 12, 15, 21, 4, 25, 0, 69, 69, 69, 69, 69, 69, 0, 0, 69, 69, 69, 69, 69, 0, 0],
      [36, 36, 4, 5, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 69, 69, 69, 69, 69, 69, 0],
      [36, 36, 13, 16, 8, 0, 0, 69, 69, 69, 69, 69, 69, 69, 0, 0, 0, 0, 0, 0, 0, 0],
      [11, 22, 2, 20, 0, 0, 69, 69, 69, 69, 69, 69, 69, 69, 69, 0, 0, 69, 69, 69, 69, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 69, 69, 69, 69, 69]
    ];
    const clearTemplate = [
      [0, 0, 0, 0, 65, 65, 65, 65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 65, 65, 65, 64, 64, 64, 64, 65, 65, 65, 0, 0, 0, 19, 21, 14, 14, 25, 0, 0],
      [0, 65, 65, 64, 64, 64, 63, 63, 64, 64, 64, 65, 65, 0, 0, 36, 36, 4, 5, 7, 0, 0],
      [65, 65, 64, 64, 63, 63, 63, 63, 63, 63, 64, 64, 65, 65, 0, 36, 36, 13, 16, 8, 0, 0],
      [0, 0, 0, 0, 23, 5, 12, 3, 15, 13, 5, 0, 20, 15, 0, 22, 2, 20, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 5, 14, 20, 15, 14, 20, 9, 12, 12, 5, 55, 1, 18, 0, 0, 0, 0]
    ];
    let template;
    if (description.toLowerCase().includes('cloud')) {
      template = cloudyTemplate;
    } else if (description.toLowerCase().includes('clear')) {
      template = clearTemplate;
    } else {
      template = cloudyTemplate; // fallback
    }
    let matrix = template.map(row => [...row]);
    matrix[2] = replaceFirstPair(matrix[2], tempArr, 36);
    matrix[3] = replaceFirstPair(matrix[3], windArr, 36);
    console.log('[getWeatherMatrix] matrix:', matrix);
    return matrix;
  } catch (error) {
    console.error('[WeatherMatrixError]', error);
    const errorRow = padOrTruncate(stringToVestaboardCodes('WEATHER ERROR'), 22, 0);
    return [errorRow, ...Array(5).fill(padOrTruncate([], 22, 0))];
  }
}
