import axios from 'axios';
import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { Folder } from '../models/folder.model.js';

import jwt from 'jsonwebtoken';
import {
    Client,
    StreamableHTTPClientTransport
} from '@modelcontextprotocol/client';

// LMStudio Call
export const cwmLMStudio = async ({
    text,
    messages,
    model,
    temperature = 0.7,
    maxTokens = 512,
    tools = undefined
}) => {
    const response = await axios.post(
        process.env.LM_STUDIO_URL,
        {
            model,
            messages: messages || [
                {
                    role: 'user',
                    content: text
                }
            ],
            ...(tools?.length ? { tools } : {}),
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

// OpenRouter Call
export const cwmOpenRouter = async ({
    text,
    messages,
    model,
    temperature = 0.7,
    maxTokens = 512,
    tools = undefined
}) => {
    const response = await axios.post(
    process.env.OPENROUTER_URL,
    {
        model,
        messages: messages || [
            {
                role: 'user',
                content: text,
            }
        ],
        ...(tools?.length ? { tools } : {}),
        temperature,
        max_tokens: maxTokens,
        stream: false
    },
    {
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            // 'HTTP-Referer': process.env.SITE_URL,
            // 'X-OpenRouter-Title': process.env.SITE_NAME,
            'Content-Type': 'application/json',
        },
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


export const cwm = async ({
    text,
    messages,
    model,
    temperature = 0.7,
    maxTokens = 512,
    tools = undefined
}) => {
    const currentProvider = process.env.CURRENT_PROVIDER;

    switch (currentProvider) {
        case "LMSTUDIO":
            return await cwmLMStudio({text, messages, model, temperature, maxTokens, tools});
            break;
        case "OPENROUTER":
            return await cwmOpenRouter({text, messages, model, temperature, maxTokens, tools});
            break;
        default:
            throw new Error('Invalid AI provider requested via server');
            break;
    }
};


const createMcpClient = async (userId) => {
    const token = jwt.sign(
        {
            id: userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.MCP_JWT_EXPIRES_IN || '5m'
        }
    );

    const client = new Client({
        name: 'caffeinated-server',
        version: '1.0.0'
    });

    const transport = new StreamableHTTPClientTransport(
        new URL(process.env.MCP_SERVER_URL),
        {
            requestInit: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );

    await client.connect(transport);

    return client;
};


const getMcpTools = async (client) => {
    const result = await client.listTools();

    return result.tools.map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description || '',
            parameters: tool.inputSchema || {
                type: 'object',
                properties: {}
            }
        }
    }));
};


const executeMcpTool = async (
    client,
    toolCall
) => {
    const toolName = toolCall.function.name;

    let argumentsObject = {};

    try {
        argumentsObject = toolCall.function.arguments
            ? JSON.parse(toolCall.function.arguments)
            : {};
    } catch {
        throw new Error(
            `Invalid arguments for tool ${toolName}`
        );
    }

    const result = await client.callTool({
        name: toolName,
        arguments: argumentsObject
    });

    return result;
};


const serializeMcpResult = (result) => {
    if (!result) {
        return '';
    }

    if (result.structuredContent) {
        return JSON.stringify(
            result.structuredContent
        );
    }

    if (Array.isArray(result.content)) {
        return result.content
            .map((item) => {
                if (item.type === 'text') {
                    return item.text;
                }

                return JSON.stringify(item);
            })
            .join('\n');
    }

    return JSON.stringify(result);
};

const buildMessages = ({ context, messages }) => [
    {
        role: 'system',
        content: `
Current application context:
${JSON.stringify(context)}
`
    },
    ...messages
];

// Create a message / run a chat
export const chat = async ({
    userId,
    chatId = null,
    folderId = null,
    text,
    context,
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

        const titleResponse = await cwmLMStudio({
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
        context,
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
        })
            .sort({ seq: 1 })
            .lean();

        const messages = previousMessages.map((message) => ({
            role: message.sender === 'user'
                ? 'user'
                : 'assistant',
            content: message.text
        }));

        const mcpClient = await createMcpClient(userId);

        try {
            const tools = await getMcpTools(mcpClient);

            let currentResponse = await cwm({
                messages: buildMessages({context, messages}),
                model,
                temperature,
                maxTokens,
                tools
            });

            const MAX_TOOL_ROUNDS = 8;

            for (
                let round = 0;
                round < MAX_TOOL_ROUNDS;
                round++
            ) {
                const toolCalls = currentResponse.toolCalls;

                if (!toolCalls?.length) {
                    break;
                }

                messages.push({
                    role: 'assistant',
                    content: currentResponse.text || null,
                    tool_calls: toolCalls
                });

                for (const toolCall of toolCalls) {
                    try {
                        const toolResult = await executeMcpTool(
                            mcpClient,
                            toolCall
                        );

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: serializeMcpResult(
                                toolResult
                            )
                        });
                    } catch (toolError) {
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({
                                error: toolError.message
                            })
                        });
                    }
                }

                currentResponse = await cwm({
                    messages: buildMessages({context, messages}),
                    model,
                    temperature,
                    maxTokens,
                    tools
                });
            }

            if (currentResponse.toolCalls?.length) {
                throw new Error(
                    'Maximum MCP tool rounds exceeded'
                );
            }

            const aiSeq = userSeq + 1;
            const aiTimestamp = new Date();

            const aiMessage = await Message.create({
                chatId,
                seq: aiSeq,
                thoughts:
                    currentResponse.reasoning || null,
                text: currentResponse.text,
                sender: 'assistant',
                model: currentResponse.model,
                status: 'completed',
                timestamp: aiTimestamp
            });

            await Chat.updateOne(
                { _id: chatId },
                {
                    $set: {
                        lastMessage: currentResponse.text,
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
                    usage: currentResponse.usage,
                    responseId:
                        currentResponse.responseId,
                    toolCalls:
                        currentResponse.toolCalls
                }
            };
        } finally {
            await mcpClient.close();
        }
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
                    lastMessage:
                        'Unable to generate a response.',
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