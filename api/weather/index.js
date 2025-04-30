// Weather API endpoint - returns a Vestaboard matrix for current weather
import { getWeatherMatrix } from '../../vestaboard/weatherConversion';

export default async function handler(req, res) {
  // Basic CORS setup (consistent with other endpoints)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Require format=vestaboard to return the matrix
    if (req.query && req.query.format === 'vestaboard') {
      try {
        const matrix = await getWeatherMatrix();
        return res.status(200).json(matrix);
      } catch (error) {
        console.error('Error getting weather matrix:', error);
        return res.status(500).json({ message: 'Error retrieving weather matrix' });
      }
    } else {
      // If format is not vestaboard, return an error or a default message
      return res.status(400).json({ message: 'Missing or invalid format. Use ?format=vestaboard to get the matrix.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
