// Weather API endpoint - returns a Vestaboard matrix for current weather
import { getWeatherMatrix } from '../weatherConversion';

export default async function handler(req, res) {
  // Basic CORS setup (consistent with other endpoints)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const matrix = await getWeatherMatrix();
      return res.status(200).json({ matrix });
    } catch (error) {
      console.error('Error getting weather matrix:', error);
      return res.status(500).json({ message: 'Error retrieving weather matrix' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
