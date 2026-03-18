import { getDemandPrediction } from '../services/aiService.js';
import demandPredictionService from '../services/demandPredictionService.js';
import { getStoredUser } from '../utils/auth.js'; // Assume auth util

export async function getDemandForecast(req, res) {
  try {
    const userId = req.user?.id; // From auth middleware
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const prediction = await demandPredictionService.getVendorDemandPrediction(userId);
    res.json(prediction);
  } catch (error) {
    console.error('[aiController] Demand forecast error:', error);
    res.status(500).json({ message: 'Prediction failed' });
  }
}

import demandPredictionService from '../services/demandPredictionService.js';

export default { getDemandForecast };

