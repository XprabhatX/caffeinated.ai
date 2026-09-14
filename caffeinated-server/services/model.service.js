import { Model } from '../models/model.model.js';

// Fetch available models according to current provider
export const getAvailableModels = async () => {
    const currentProvider = process.env.CURRENT_PROVIDER;

    if (!currentProvider) {
        throw new Error('AI provider is not configured');
    }

    return await Model.find({
        provider: currentProvider
    })
        .sort({ organization: 1, name: 1 })
        .lean();
};


// Fetch all models
export const getAllModels = async () => {
    return await Model.find({})
        .sort({ provider: 1, organization: 1, name: 1 })
        .lean();
};

// Sync models for a provider
export const syncModels = async (models, provider) => {
    if (!provider) {
        throw new Error('Provider is required');
    }

    if (!Array.isArray(models)) {
        throw new Error('Models must be an array');
    }

    const operations = models.map((model) => ({
        updateOne: {
            filter: {
                provider,
                alias: model.alias
            },
            update: {
                $set: {
                    ...model,
                    provider
                }
            },
            upsert: true
        }
    }));

    if (operations.length > 0) {
        await Model.bulkWrite(operations);
    }

    const aliases = models.map((model) => model.alias);

    const deleteResult = await Model.deleteMany({
        provider,
        alias: {
            $nin: aliases
        }
    });

    return {
        upsertedOrUpdated: operations.length,
        deleted: deleteResult.deletedCount
    };
};