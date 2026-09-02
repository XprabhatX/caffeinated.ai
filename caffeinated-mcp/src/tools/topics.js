import { z } from 'zod';
import { Topic } from '../models/topic.model.js';
import { Folder } from '../models/folder.model.js';

const verifyFolderOwnership = async (folderId, userId) => {
    return await Folder.findOne({
        _id: folderId,
        userId
    });
};

const verifyTopicOwnership = async (topicId, userId) => {
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

const serializeTopic = (topic) => ({
    id: topic._id.toString(),
    name: topic.name,
    description: topic.description || ''
});

export const registerTopicTools = (server, user) => {
    const userId = user.id;

    server.tool(
        'get_topics',
        'Get all topics in a folder. Returns lightweight topic information without notes.',
        {
            folderId: z.string()
        },
        async ({ folderId }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const topics = await Topic.find({
                folderId
            })
                .select('_id name description')
                .sort({ createdAt: 1 })
                .lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            topics.map(serializeTopic)
                        )
                    }
                ]
            };
        }
    );

    server.tool(
        'search_topics',
        'Search topics within a folder by keyword. Searches topic names and descriptions. Does not return notes.',
        {
            folderId: z.string(),
            query: z.string()
        },
        async ({ folderId, query }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const search = query.trim();

            if (!search) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Search query cannot be empty.'
                        }
                    ],
                    isError: true
                };
            }

            const topics = await Topic.find({
                folderId,
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: search,
                            $options: 'i'
                        }
                    }
                ]
            })
                .select('_id name description')
                .sort({ createdAt: 1 })
                .lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            topics.map(serializeTopic)
                        )
                    }
                ]
            };
        }
    );

    server.tool(
        'get_topic',
        'Get a topic by ID, including its complete notes.',
        {
            topicId: z.string()
        },
        async ({ topicId }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: topic._id.toString(),
                            name: topic.name,
                            description: topic.description || '',
                            notes: topic.notes || '',
                            folderId: topic.folderId.toString()
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'create_topic',
        'Create a new topic inside a folder.',
        {
            folderId: z.string(),
            name: z.string(),
            description: z.string().optional()
        },
        async ({
            folderId,
            name,
            description
        }) => {
            const folder = await verifyFolderOwnership(
                folderId,
                userId
            );

            if (!folder) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Folder not found.'
                        }
                    ],
                    isError: true
                };
            }

            const topic = await Topic.create({
                name,
                description: description || '',
                folderId,
                notes: '',
                context: {}
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: topic._id.toString(),
                            name: topic.name,
                            description: topic.description || ''
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'delete_topic',
        'Delete a topic belonging to the current user.',
        {
            topicId: z.string()
        },
        async ({ topicId }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            await Topic.deleteOne({
                _id: topicId
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            topicId
                        })
                    }
                ]
            };
        }
    );

    server.tool(
        'update_topic',
        'Update the name or description of a topic.',
        {
            topicId: z.string(),
            name: z.string().optional(),
            description: z.string().optional()
        },
        async ({
            topicId,
            name,
            description
        }) => {
            const topic = await verifyTopicOwnership(
                topicId,
                userId
            );

            if (!topic) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Topic not found.'
                        }
                    ],
                    isError: true
                };
            }

            const updates = {};

            if (name !== undefined) {
                updates.name = name;
            }

            if (description !== undefined) {
                updates.description = description;
            }

            const updatedTopic = await Topic.findOneAndUpdate(
                {
                    _id: topicId
                },
                {
                    $set: updates
                },
                {
                    new: true
                }
            ).lean();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: updatedTopic._id.toString(),
                            name: updatedTopic.name,
                            description:
                                updatedTopic.description || ''
                        })
                    }
                ]
            };
        }
    );
};