import {
    getTopicForFolder,
    addTopicForFolder,
    deleteTopicById,
    upsertNotesForTopic,
    getTopicById
} from '../services/topic.service.js';

export const getTopics = async (req, res, next) => {
    try {
        const { folderId } = req.query;

        if (!folderId)
            return res.status(400).json({ message: 'invalid folderId' });

        const topics = await getTopicForFolder(folderId);

        res.status(200).json(topics);
    } catch (error) {
        next(error);
    }
};

export const getTopic = async (req, res, next) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;

        if (!topicId || !userId) {
            return res.status(400).json({
                message: 'invalid data received'
            });
        }

        const topic = await getTopicById(userId, topicId);

        if (!topic) {
            return res.status(404).json({
                message: 'Topic not found'
            });
        }

        return res.status(200).json(topic);
    } catch (error) {
        next(error);
    }
};

export const addTopic = async (req, res, next) => {
    try {
        const topicData = req.body;

        if (!topicData)
            return res.status(400).json({ message: 'invalid data received' });

        const topic = await addTopicForFolder(topicData);

        return res.status(200).json(topic);
    } catch (error) {
        next(error);
    }
};

export const upsertTopicNotes = async (req, res, next) => {
    try {
        const { topicId } = req.params;
        const { notes } = req.body;
        const userId = req.user.id;

        if (!topicId || !userId) {
            return res.status(400).json({
                message: 'invalid data received'
            });
        }

        if (notes === undefined) {
            return res.status(400).json({
                message: 'notes is required'
            });
        }

        const topic = await upsertNotesForTopic(
            userId,
            topicId,
            notes
        );

        if (!topic) {
            return res.status(404).json({
                message: 'Topic not found'
            });
        }

        return res.status(200).json(topic);
    } catch (error) {
        next(error);
    }
};

export const deleteTopic = async (req, res, next) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;

        if (!topicId || !userId) {
            return res.status(400).json({
                message: 'invalid data received'
            });
        }

        const topic = await deleteTopicById(userId, topicId);

        if (!topic) {
            return res.status(404).json({
                message: 'Topic not found'
            });
        }

        return res.status(200).json({
            message: 'Topic deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};