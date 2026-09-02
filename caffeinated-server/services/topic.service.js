import { Topic } from '../models/topic.model.js';
import { Folder } from '../models/folder.model.js';


export const getTopicForFolder = async (folderId) => {
    return await Topic.find({ folderId })
        .select('name folderId');
};

export const getTopicById = async (userId, topicId) => {
    const topic = await Topic.findOne({
        _id: topicId
    });

    if (!topic) {
        return null;
    }

    const folder = await Folder.findOne({
        _id: topic.folderId,
        userId
    });

    if (!folder) {
        return null;
    }

    return topic;
};

export const addTopicForFolder = async (topicData) => {
    
    const {
        name,
        folderId,
        notes
    } = topicData;

    
    const newTopic = {
        name,
        folderId,
        notes,
        context: {}
    };
    
    const topic = await Topic.insertOne(newTopic);

    return topic;
}

export const deleteTopicById = async (userId, topicId) => {
    const topic = await Topic.findOne({
        _id: topicId
    });

    if (!topic) {
        return null;
    }

    const folder = await Folder.findOne({
        _id: topic.folderId,
        userId
    });

    if (!folder) {
        return null;
    }

    await Topic.deleteOne({
        _id: topicId
    });

    return topic;
};

export const upsertNotesForTopic = async (userId, topicId, notes) => {
    const topic = await Topic.findOne({
        _id: topicId
    });

    if (!topic) {
        return null;
    }

    const folder = await Folder.findOne({
        _id: topic.folderId,
        userId
    });

    if (!folder) {
        return null;
    }

    const updatedTopic = await Topic.findOneAndUpdate(
        { _id: topicId },
        { $set: { notes } },
        {
            new: true
        }
    );

    return updatedTopic;
};