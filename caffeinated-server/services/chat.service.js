import axios from 'axios';
import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { Folder } from '../models/folder.model.js';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL;


// Abstract model call
export const cwm = async ({
    text,
    messages,
    model,
    temperature = 0.7,
    maxTokens = 512
}) => {
    const response = await axios.post(
        LM_STUDIO_URL,
        {
            model,
            messages: messages || [
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: false
        }
    );

    const choice = response.data?.choices?.[0];

    if (!choice) {
        throw new Error('Invalid response received from model');
    }

    return {
        text: choice.message?.content || '',
        reasoning: choice.message?.reasoning_content || '',
        toolCalls: choice.message?.tool_calls || [],
        usage: response.data?.usage || null,
        model: response.data?.model || model,
        responseId: response.data?.id || null
    };
};


// Create a message / run a chat
export const chat = async ({
    userId,
    chatId = null,
    folderId = null,
    text,
    model,
    temperature = 0.7,
    maxTokens = 512
}) => {
    let chatDocument;

    // New chat requires a folder owned by the current user
    if (!chatId) {
        if (!folderId) {
            throw new Error(
                'folderId is required when creating a new chat'
            );
        }

        const folder = await Folder.findOne({
            _id: folderId,
            userId
        });

        if (!folder) {
            throw new Error('Folder not found');
        }

        const titleResponse = await cwm({
            model: 'qwen/qwen3-1.7b',
            messages: [
                {
                    role: 'system',
                    content: `Generate a short title for the user's message.

        Rules:
        - Maximum 4 words
        - Minimum possible number of words
        - No quotes
        - No punctuation
        - Return only the title`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            maxTokens: 16,
            temperature: 0.3
        });

        let chatName = titleResponse.text
            ?.trim()
            .split(/\s+/)
            .slice(0, 4)
            .join(' ');

        // Fallback if the title model returns an empty response
        if (!chatName) {
            chatName = text
                .trim()
                .split(/\s+/)
                .slice(0, 4)
                .join(' ');
        }

        chatDocument = await Chat.create({
            userId,
            folderId,
            name: chatName,
            lastMessage: null,
            lastTimestamp: null
        });

        chatId = chatDocument._id;
    } else {
        chatDocument = await Chat.findOne({
            _id: chatId
        });

        if (!chatDocument) {
            throw new Error('Chat not found');
        }

        const folder = await Folder.findOne({
            _id: chatDocument.folderId,
            userId
        });

        if (!folder) {
            throw new Error('Chat not found');
        }

        folderId = chatDocument.folderId;
    }

    const lastMessage = await Message.findOne({
        chatId
    }).sort({ seq: -1 });

    const userSeq = lastMessage
        ? lastMessage.seq + 1
        : 1;

    const userTimestamp = new Date();

    const userMessage = await Message.create({
        chatId,
        seq: userSeq,
        text,
        sender: 'user',
        model: null,
        status: 'completed',
        timestamp: userTimestamp
    });

    await Chat.updateOne(
        { _id: chatId },
        {
            $set: {
                lastMessage: text,
                lastTimestamp: userTimestamp
            }
        }
    );

    /*
     * AGENT LOOP
     *
     * This is where the service will eventually:
     *
     * 1. Send the current messages to the model.
     * 2. Inspect tool_calls from the response.
     * 3. Execute the requested tools.
     * 4. Append tool results to messages.
     * 5. Call the model again.
     * 6. Repeat until the model returns a normal response.
     *
     * The current implementation intentionally stops after one model call.
     */

    try {
        const previousMessages = await Message.find({
            chatId
        }).sort({ seq: 1 }).lean();

        const messages = previousMessages.map((message) => ({
            role: message.sender === 'user'
                ? 'user'
                : 'assistant',
            content: message.text
        }));

        messages.push({
            role: 'user',
            content: text
        });

        const aiResponse = await cwm({
            messages,
            model,
            temperature,
            maxTokens
        });

        const aiSeq = userSeq + 1;
        const aiTimestamp = new Date();

        const aiMessage = await Message.create({
            chatId,
            seq: aiSeq,
            thoughts: aiResponse.reasoning || null,
            text: aiResponse.text,
            sender: 'assistant',
            model: aiResponse.model,
            status: 'completed',
            timestamp: aiTimestamp
        });

        await Chat.updateOne(
            { _id: chatId },
            {
                $set: {
                    lastMessage: aiResponse.text,
                    lastTimestamp: aiTimestamp
                }
            }
        );

        return {
            chatId,
            messages: [
                userMessage,
                aiMessage
            ],
            meta: {
                usage: aiResponse.usage,
                responseId: aiResponse.responseId,
                toolCalls: aiResponse.toolCalls
            }
        };
    } catch (error) {
        const failedTimestamp = new Date();

        await Message.create({
            chatId,
            seq: userSeq + 1,
            thoughts: null,
            text: 'Unable to generate a response.',
            sender: 'assistant',
            model,
            status: 'failed',
            timestamp: failedTimestamp
        });

        await Chat.updateOne(
            { _id: chatId },
            {
                $set: {
                    lastMessage: 'Unable to generate a response.',
                    lastTimestamp: failedTimestamp
                }
            }
        );

        throw error;
    }
};


// Fetch chats belonging to a folder
export const getChatsForFolder = async ({
    userId,
    folderId
}) => {
    const folder = await Folder.findOne({
        _id: folderId,
        userId
    });

    if (!folder) {
        throw new Error('Folder not found');
    }

    return await Chat.find({
        folderId
    })
        .sort({ createdAt: 1 })
        .lean();
};

// Fetch messages belonging to a chat
export const getMessagesForChat = async ({
    chatId
}) => {
    return await Message.find({
        chatId
    })
        .sort({ seq: 1 })
        .lean();
};