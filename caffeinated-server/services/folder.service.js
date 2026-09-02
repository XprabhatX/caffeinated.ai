import { Folder } from '../models/folder.model.js';
import { Topic } from '../models/topic.model.js';
import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';

export const getAllFolders = async (userId, keyword = '') => {
    const folders = await Folder.find({
        userId,
        name: { $regex: keyword, $options: 'i' }
    });

    return folders;
}

export const addFolder = async(folderData) => {

    const {
        userId,
        name,
        description} = folderData;
    
    const newFolder = {
        userId,
        name,
        description,
        repository: [],
        context: {}
    };

    const folder = await Folder.insertOne(newFolder);

    return folder;
}

export const updateFolder = async (userId, folderId, updates) => {
    const folder = await Folder.findOneAndUpdate(
        {
            _id: folderId,
            userId
        },
        {
            $set: updates
        },
        {
            new: true,
            runValidators: true
        }
    );

    return folder;
};


export const deleteFolder = async (userId, folderId) => {
    // First verify the folder belongs to the user
    const folder = await Folder.findOne({
        _id: folderId,
        userId
    });

    if (!folder) {
        return null;
    }

    // Delete topics belonging to the folder
    await Topic.deleteMany({
        folderId
    });

    // Find chats so we can delete their messages
    const chats = await Chat.find({
        folderId
    }).select('_id');

    const chatIds = chats.map(chat => chat._id);

    // Delete messages belonging to those chats
    if (chatIds.length > 0) {
        await Message.deleteMany({
            chatId: { $in: chatIds }
        });
    }

    // Delete chats
    await Chat.deleteMany({
        folderId
    });

    // Finally delete the folder
    await Folder.deleteOne({
        _id: folderId
    });

    return folder;
};