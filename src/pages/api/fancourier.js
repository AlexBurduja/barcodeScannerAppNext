import axios from 'axios';

export default async function handler(req, res) {
  try {
    const response = await axios.post(
      'https://api.fancourier.ro/intern-awb',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
