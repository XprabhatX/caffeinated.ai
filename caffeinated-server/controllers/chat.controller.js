import {
    chat,
    getChatsForFolder,
    getMessagesForChat
} from '../services/chat.service.js';

export const sendMessage = async (req, res, next) => {
    try {
        const {
            chatId,
            folderId,
            text,
            model
        } = req.body;

        const userId = req.user.id;

        if (!userId || !text || !model) {
            return res.status(400).json({
                message: 'text and model are required'
            });
        }

        if (!chatId && !folderId) {
            return res.status(400).json({
                message: 'folderId is required when starting a new chat'
            });
        }

        const result = await chat({
            userId,
            chatId,
            folderId,
            text,
            model
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Get chats for a folder
export const getChats = async (req, res, next) => {
    try {
        const { folderId } = req.query;
        const userId = req.user.id;

        if (!userId || !folderId) {
            return res.status(400).json({
                message: 'folderId is required'
            });
        }

        const chats = await getChatsForFolder({
            userId,
            folderId
        });

        return res.status(200).json(chats);
    } catch (error) {
        next(error);
    }
};

// Get messages for a chat
export const getChatMessages = async (req, res, next) => {
    try {
        const { chatId } = req.query;

        if (!chatId) {
            return res.status(400).json({
                message: 'chatId is required'
            });
        }

        const messages = await getMessagesForChat({
            chatId
        });

        return res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};