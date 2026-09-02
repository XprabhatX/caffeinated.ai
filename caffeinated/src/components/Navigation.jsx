import axios from 'axios';
import React, { useState, useEffect } from 'react';

const Navigation = (props) => {
    const {
        user,
        currentTopic,
        setCurrentTopic,
        currentFolder,
        setCurrentFolder
    } = props;
    const token = localStorage.getItem('token');

    const hour = new Date().getHours();
    const greetings =
        hour < 12
            ? 'Good morning'
            : hour < 18
                ? 'Good afternoon'
                : 'Good evening';

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const [folders, setFolders] = useState([]);
    const [openedFolder, setOpenedFolder] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingTopicCreation, setLoadingTopicCreation] = useState(false);

    // Fetch folders
    useEffect(() => {
        const fetchFolderData = async () => {
            try {
                const response = await axios.get(
                    'http://localhost:5000/api/folders',
                    { headers }
                );

                console.log('folder data:', response.data);
                setFolders(response.data);
            } catch (err) {
                console.error(
                    'failed to fetch folder data:',
                    err.response?.data || err.message
                );
            }
        };

        fetchFolderData();
    }, []);

    // Fetch topics for a folder
    const fetchTopics = async (folderId) => {
        setLoadingTopics(true);

        try {
            const response = await axios.get(
                'http://localhost:5000/api/topics',
                {
                    params: {
                        folderId,
                    },
                    headers,
                }
            );

            console.log('topics data:', response.data);
            setTopics(response.data);
        } catch (error) {
            console.error(
                'failed to fetch topics:',
                error.response?.data || error.message
            );
            setTopics([]);
        } finally {
            setLoadingTopics(false);
        }
    };

    // Create folder
    const handleNewFolder = async () => {
        const name = prompt('enter folder name');
        const description = prompt('enter folder description');

        if (!name) return;

        try {
            const response = await axios.post(
                'http://localhost:5000/api/folders',
                {
                    name,
                    description,
                },
                { headers }
            );

            console.log('created folder:', response.data);

            setFolders((prev) => [...prev, response.data]);
        } catch (err) {
            console.error(
                'failed to create folder:',
                err.response?.data || err.message
            );
        }
    };

    // Open / close folder
    const handleOpenFolder = async (folderId) => {
        // Close currently opened folder
        if (folderId === openedFolder) {
            setOpenedFolder(null);
            setCurrentFolder(null);
            setTopics([]);
            return;
        }

        setOpenedFolder(folderId);
        setCurrentFolder(folderId);
        await fetchTopics(folderId);
    };

    // Create topic
    const handleAddTopic = async (folderId) => {
        const topicName = prompt('enter topic name');

        if (!topicName) return;

        setLoadingTopicCreation(true);

        try {
            await axios.post(
                'http://localhost:5000/api/topics',
                {
                    name: topicName,
                    folderId,
                },
                { headers }
            );

            // Refresh topics without toggling the folder closed
            await fetchTopics(folderId);
        } catch (error) {
            console.error(
                'failed to create topic:',
                error.response?.data || error.message
            );
        } finally {
            setLoadingTopicCreation(false);
        }
    };

    // Delete Topic
    const handleDeleteTopic = async (topicId, folderId) => {
        try {
            await axios.delete(
                `http://localhost:5000/api/topics/${topicId}`,
                { headers }
            );

            // Remove the deleted topic immediately from UI
            setTopics((prev) =>
                prev.filter((topic) => topic._id !== topicId)
            );
        } catch (error) {
            console.error(
                'failed to delete topic:',
                error.response?.data || error.message
            );
        }
    };

    // Select Topic
    const handleSelectTopic = async (topicId) => {
        setCurrentTopic(topicId);
    }

    return (
        <div className="w-[13%] h-full bg-[#895737] text-[#f3e9dc]">
            <div className="px-2 pt-4 mb-5">
                {`${greetings} ${user?.username}`}
            </div>

            {folders.length > 0 ? (
                <div className="flex flex-col pb-1 rounded-lg justify-center">
                    {folders.map((folder) => (
                        <div
                            key={folder._id}
                            className="flex flex-col p-2 rounded-md"
                        >
                            <div className="flex justify-between items-center bg-white/10 rounded-xl px-1.5">
                                {/* Folder toggle */}
                                <div
                                    onClick={() =>
                                        handleOpenFolder(folder._id)
                                    }
                                    className="cursor-pointer"
                                >
                                    {folder._id === openedFolder ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    )}
                                </div>

                                {/* Folder name */}
                                <div>{folder.name}</div>

                                {/* Add topic */}
                                <div
                                    onClick={() =>
                                        handleAddTopic(folder._id)
                                    }
                                    className="cursor-pointer"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            d="M12 5V19M5 12H19"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Topics */}
                            {folder._id === openedFolder && (
                                <div className="ml-6 mt-2">
                                    {loadingTopics ? (
                                        <div className="flex justify-left items-center pb-3">
                                            <img
                                                src="/loading.gif"
                                                alt="Loading topics"
                                                className="w-6 h-6 mr-2"
                                            />
                                            <p>Loading</p>
                                        </div>
                                    ) : topics.length > 0 ? (
                                        topics.map((t) => (
                                            <div
                                                key={t._id}
                                                className="flex items-center justify-between group py-1"
                                            >
                                                {/* Topic */}
                                                <div
                                                    className={`hover:underline cursor-pointer truncate px-2 rounded-lg ${t._id === currentTopic ? 'bg-white/10' : ''}`}
                                                    onClick={() => handleSelectTopic(t._id)}
                                                >
                                                    {t.name}
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTopic(topic._id, folder._id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-2"
                                                    title="Delete topic"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-4 h-4"
                                                    >
                                                        <path
                                                            d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-2 text-sm opacity-70">
                                            empty
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col px-2 rounded-lg">
                    you don't have folders
                </div>
            )}

            <span
                className="flex flex-col px-2 rounded-lg underline underline-offset-2 cursor-pointer"
                onClick={handleNewFolder}
            >
                create one
            </span>
        </div>
    );
};

export default Navigation;