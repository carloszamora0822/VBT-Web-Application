// Weather Conversion Logic for Vestaboard Matrix
// Consistent with existing conversion modules (e.g., birthdayConversion.js)
import fetch from 'node-fetch';

const VESTABOARD_CHAR_CODES = {
  "0": 36, "1": 27, "2": 28, "3": 29, "4": 30,
  "5": 31, "6": 32, "7": 33, "8": 34, "9": 35,
  "°": 62, "F": 6
};

// Helper to convert a string (e.g., "72°F") to an array of Vestaboard codes
function stringToVestaboardCodes(str) {
  return [...str].map(char => VESTABOARD_CHAR_CODES[char] ?? 0);
}

export async function fetchWeatherData() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const location = process.env.OPENWEATHER_LOCATION || 'Austin,US';
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
  const { temperatureArray, windArray, description } = await fetchWeatherData();
  // Matrix templates (24,24 are placeholders)
  if (description.toLowerCase().includes('clear')) {
    const matrix = [
      [0,0,0,0,65,65,65,65,65,65,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,65,65,65,64,64,64,64,65,65,65,0,0,0,19,21,14,14,25,0,0],
      [0,65,65,64,64,64,63,63,64,64,64,65,65,0,0, ...temperatureArray, 4,5,7,0,0],
      [65,65,64,64,63,63,63,63,63,63,64,64,65,65,0, ...windArray, 13,16,8,0,0],
      [0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0],
      [0,0,0,0,2,5,14,20,15,14,20,9,12,12,5,55,1,18,0,0,0,0]
    ];
    return matrix;
  }
  if (description.toLowerCase().includes('clouds')) {
    const matrix = [
      [0,0,0,0,0,0,0,0,69,69,69,69,0,0,0,0,0,0,0,0,0,0],
      [3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0],
      [...temperatureArray, 4,5,7,0,0,0,0,0,0,0,0,0,69,69,69,69,69,69,69,0],
      [...windArray, 13,16,8,0,0,69,69,69,69,69,69,69,69,0,0,0,0,0,0,0,0],
      [11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69]
    ];
    return matrix;
  }
  if (description.toLowerCase().includes('rain')) {
    const matrix = [
      [0,0,0,0,0,0,0,0,69,69,69,69,0,0,0,0,0,0,0,0,0,0],
      [3,12,15,21,4,25,0,69,69,69,69,69,69,0,0,69,69,69,69,69,0,0],
      [...temperatureArray, 4,5,7,0,0,0,0,0,0,0,0,0,69,69,69,69,69,69,69,0],
      [...windArray, 13,16,8,0,0,69,69,69,69,69,69,69,69,0,0,0,0,0,0,0,0],
      [11,22,2,20,0,0,69,69,69,69,69,69,69,69,69,0,0,69,69,69,69,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,69,69,69,69]
    ];
    return matrix;
  }
  // Default fallback
  const matrix = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,23,5,1,20,8,5,18,0,0,0,0,0,0,0,0,0,0],
    [0,0, ...temperatureArray, 62,6,0,0,23,9,14,4,28, ...windArray, 0,13,16,8,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,23,5,12,3,15,13,5,0,20,15,0,22,2,20,0,0,0,0],
    [0,0,0,0,2,5,14,20,15,14,22,9,12,12,5,55,1,18,0,0,0,0]
  ];
  return matrix;
}
