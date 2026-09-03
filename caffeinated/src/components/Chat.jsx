import axios from 'axios';
import React, { useEffect, useState } from 'react';
import MarkdownRenderer from './markdown/MarkdownRenderer';

const Chat = (props) => {
    const { currentFolder } = props;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const token = localStorage.getItem('token');

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    const [message, setMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [modelError, setModelError] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const [models] = useState([
        {
            name: 'qwen3.5-4b',
            value: 'qwen3.5-4b',
        },
        {
            name: 'qwen3-1.7b',
            value: 'qwen/qwen3-1.7b',
        },
    ]);

    const [selectedModel, setSelectedModel] = useState(
        'qwen/qwen3-1.7b'
    );

    const messagesEndRef = React.useRef(null);

    // Fetch chats whenever the selected folder changes
    useEffect(() => {
        if (!currentFolder) {
            setChats([]);
            setMessages([]);
            setActiveChatId(null);
            return;
        }

        const fetchChats = async () => {
            setLoadingChats(true);

            try {
                const response = await axios.get(
                    `${apiBaseUrl}/api/chat/chats`,
                    {
                        params: {
                            folderId: currentFolder._id,
                        },
                        headers,
                    }
                );

                setChats(response.data || []);
            } catch (error) {
                console.error(
                    'failed to fetch chats:',
                    error.response?.data || error.message
                );

                setChats([]);
            } finally {
                setLoadingChats(false);
            }
        };

        fetchChats();
    }, [currentFolder]);

    // scroll to bottom of the chat automatically
    useEffect(() => {
        if (!activeChatId) return;

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [messages, activeChatId]);

    // Fetch messages only when a chat is opened
    const handleOpenChat = async (chatId) => {
        setActiveChatId(chatId);
        setMessages([]);
        setLoadingMessages(true);

        try {
            const response = await axios.get(
                `${apiBaseUrl}/api/chat/messages`,
                {
                    params: {
                        chatId,
                    },
                    headers,
                }
            );

            setMessages(response.data || []);
        } catch (error) {
            console.error(
                'failed to fetch chat messages:',
                error.response?.data || error.message
            );

            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleBackToChats = () => {
        setActiveChatId(null);
        setMessages([]);
    };

    const refreshChats = async () => {
        if (!currentFolder) return;

        try {
            const response = await axios.get(
                `${apiBaseUrl}/api/chat/chats`,
                {
                    params: {
                        folderId: currentFolder._id,
                    },
                    headers,
                }
            );

            setChats(response.data || []);
        } catch (error) {
            console.error(
                'failed to refresh chats:',
                error.response?.data || error.message
            );
        }
    };

    const handleSendMessage = async () => {
        const trimmedMessage = message.trim();

        if (
            !trimmedMessage ||
            !currentFolder ||
            sendingMessage
        ) {
            return;
        }

        setMessage('');
        setSendingMessage(true);

        const context = [currentFolder];

        const tempUserMessage = {
            _id: `temp-${Date.now()}`,
            text: trimmedMessage,
            context,
            sender: 'user',
            model: null,
            status: 'completed',
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [
            ...prev,
            tempUserMessage
        ]);

        try {
            const response = await axios.post(
                `${apiBaseUrl}/api/chat/message`,
                {
                    chatId: activeChatId,
                    folderId: currentFolder._id,
                    text: trimmedMessage,
                    context,
                    model: selectedModel
                },
                {
                    headers
                }
            );

            const {
                chatId,
                messages: newMessages
            } = response.data;

            setActiveChatId(chatId);

            setMessages((prev) => {
                const withoutTemp = prev.filter(
                    (msg) => msg._id !== tempUserMessage._id
                );

                return [
                    ...withoutTemp,
                    ...newMessages
                ];
            });

            await refreshChats();
        } catch (error) {
            console.error(
                'failed to send message:',
                error.response?.data || error.message
            );

            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === tempUserMessage._id
                        ? {
                            ...msg,
                            status: 'failed'
                        }
                        : msg
                )
            );
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="w-[23%] h-full bg-[#c08552] text-[#f3e9dc] flex flex-col">

            {/* Header */}
            <div className="px-2 py-1 text-sm font-medium flex items-center">
                {activeChatId && (
                    <button
                        type="button"
                        onClick={handleBackToChats}
                        className="mr-2 opacity-80 hover:opacity-100"
                    >
                        ←
                    </button>
                )}

                Chat
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2">

                {!activeChatId ? (
                    <div>
                        {loadingChats ? (
                            <div className="text-sm opacity-70">
                                Loading chats...
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="text-sm opacity-70">
                                No chats yet. Start a conversation.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {chats.map((chat) => (
                                    <button
                                        key={chat._id}
                                        type="button"
                                        onClick={() =>
                                            handleOpenChat(chat._id)
                                        }
                                        className="w-full text-left border border-[#f3e9dc]/50 rounded-xl px-3 py-2 hover:bg-[#f3e9dc]/10"
                                    >
                                        <div className="text-sm font-medium truncate">
                                            {chat.name}
                                        </div>

                                        {chat.lastMessage && (
                                            <div className="mt-1 text-xs opacity-70 truncate">
                                                {chat.lastMessage}
                                            </div>
                                        )}

                                        {chat.lastTimestamp && (
                                            <div className="mt-1 text-[10px] opacity-50">
                                                {new Date(
                                                    chat.lastTimestamp
                                                ).toLocaleTimeString([], {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loadingMessages ? (
                            <div className="text-sm opacity-70">
                                Loading...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-sm opacity-70">
                                Start a conversation.
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div key={msg._id}>
                                        <div className="flex justify-between items-center mb-1 px-1 text-sm">
                                            <span>
                                                {msg.sender === 'user'
                                                    ? 'you'
                                                    : 'caffeinated'}

                                                {msg.sender === 'assistant' &&
                                                    msg.model && (
                                                        <span className="ml-2 opacity-60 text-xs">
                                                            {msg.model}
                                                        </span>
                                                    )}
                                            </span>

                                            <span className="text-xs opacity-80">
                                                {new Date(
                                                    msg.timestamp
                                                ).toLocaleTimeString([], {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        <div
                                            className={`border rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.status === 'failed'
                                                ? 'border-red-300/70'
                                                : 'border-[#f3e9dc]/70'
                                                }`}
                                        >
                                            {msg.thoughts && (
                                                <div className="mb-3 opacity-80">
                                                    {msg.thoughts}
                                                </div>
                                            )}

                                            <MarkdownRenderer
                                                content={msg.text}
                                            />

                                            {msg.status === 'failed' && (
                                                <div className="mt-2 text-xs opacity-80">
                                                    Response failed.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {modelError && (
                <div className="px-3 pb-2">
                    <div className="border border-red-200/50 rounded-lg px-3 py-2 text-xs">
                        Our models are down. Please wait while we are solving this.
                    </div>
                </div>
            )}

            {/* Composer — always available */}
            <div className="p-2">

                {/* Options */}
                <div className="mb-2 flex">

                    {/* Model selector */}
                    <div className="mr-2">
                        <select
                            value={selectedModel}
                            onChange={(event) =>
                                setSelectedModel(event.target.value)
                            }
                            className="bg-transparent border border-[#f3e9dc]/70 rounded-md px-2 py-1 text-xs text-[#f3e9dc] outline-none"
                        >
                            {models.map((model) => (
                                <option
                                    key={model.value}
                                    value={model.value}
                                    className="text-[#5e3023]"
                                >
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Context */}
                    <div className="text-xs p-1 flex">
                        <div className="p-1 rounded-md border border-white mr-2">Folder: {currentFolder?.name}</div>
                        <div className="p-1 rounded-md border border-white mr-2 flex cursor-pointer">
                            Current Topic <span className='ml-1'>
                                <svg
                                    viewBox="-2.5 0 32 32"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4"
                                    fill="none"
                                >
                                    <g id="SVGRepo_bgCarrier" strokeWidth="0" />
                                    <g
                                        id="SVGRepo_tracerCarrier"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <g id="SVGRepo_iconCarrier">
                                        <g id="icomoon-ignore" />
                                        <path
                                            d="M0 10.284l0.505 0.36c0.089 0.064 0.92 0.621 2.604 0.621 0.27 0 0.55-0.015 0.836-0.044 3.752 4.346 6.411 7.472 7.060 8.299-1.227 2.735-1.42 5.808-0.537 8.686l0.256 0.834 7.63-7.631 8.309 8.309 0.742-0.742-8.309-8.309 7.631-7.631-0.834-0.255c-2.829-0.868-5.986-0.672-8.686 0.537-0.825-0.648-3.942-3.3-8.28-7.044 0.11-0.669 0.23-2.183-0.575-3.441l-0.352-0.549-8.001 8.001zM1.729 10.039l6.032-6.033c0.385 1.122 0.090 2.319 0.086 2.334l-0.080 0.314 0.245 0.214c7.409 6.398 8.631 7.39 8.992 7.546l-0.002 0.006 0.195 0.058 0.185-0.087c2.257-1.079 4.903-1.378 7.343-0.836l-13.482 13.481c-0.55-2.47-0.262-5.045 0.837-7.342l0.104-0.218-0.098-0.221-0.031 0.013c-0.322-0.632-1.831-2.38-7.498-8.944l-0.185-0.215-0.282 0.038c-0.338 0.045-0.668 0.069-0.981 0.069-0.595 0-1.053-0.083-1.38-0.176z"
                                            fill="currentColor"
                                        />
                                    </g>
                                </svg>
                            </span>
                        </div>
                    </div>

                </div>

                {/* Input */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(event) =>
                            setMessage(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        disabled={sendingMessage}
                        placeholder={
                            sendingMessage
                                ? 'caffeinated is thinking...'
                                : 'Ask caffeinated...'
                        }
                        className="flex-1 min-w-0 bg-transparent border border-[#f3e9dc]/70 rounded-lg px-3 py-2 text-sm text-[#f3e9dc] placeholder-[#f3e9dc]/70 outline-none disabled:opacity-60"
                    />

                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={
                            sendingMessage ||
                            !message.trim() ||
                            !currentFolder
                        }
                        className="w-10 h-10 shrink-0 border border-[#f3e9dc]/70 rounded-full flex items-center justify-center hover:bg-[#f3e9dc]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {sendingMessage ? (
                            <div className="w-4 h-4 border-2 border-[#f3e9dc]/40 border-t-[#f3e9dc] rounded-full animate-spin" />
                        ) : (
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-5 h-5"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 12H19M19 12L13 6M19 12L13 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;