import {
    getAvailableModels,
    getAllModels,
    syncModels
} from '../services/model.service.js';

export const fetchAvailableModels = async (req, res) => {
    try {
        const models = await getAvailableModels();

        return res.status(200).json(models);
    } catch (error) {
        console.error(
            'failed to fetch available models:',
            error.message
        );

        return res.status(500).json({
            message: 'Failed to fetch available models'
        });
    }
};

export const fetchAllModels = async (req, res) => {
    try {
        const models = await getAllModels();

        return res.status(200).json(models);
    } catch (error) {
        console.error(
            'failed to fetch all models:',
            error.message
        );

        return res.status(500).json({
            message: 'Failed to fetch all models'
        });
    }
};

// Sync models for a provider
export const syncModelsForProvider = async (req, res) => {
    try {
        const { provider, models } = req.body;

        if (!provider) {
            return res.status(400).json({
                message: 'Provider is required'
            });
        }

        if (!Array.isArray(models)) {
            return res.status(400).json({
                message: 'Models must be an array'
            });
        }

        const result = await syncModels(models, provider);

        return res.status(200).json({
            message: 'Models synced successfully',
            ...result
        });
    } catch (error) {
        console.error('Error syncing models:', error);

        return res.status(500).json({
            message: 'Failed to sync models',
            error: error.message
        });
    }
};