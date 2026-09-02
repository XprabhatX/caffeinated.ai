import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import Navigation from '../components/Navigation'
import Topic from '../components/Topic'
import Chat from '../components/Chat'

const Home = (props) => {

    const {
        user,
        setUser
    } = props;

    const navigate = useNavigate();
    const [currentTopic, setCurrentTopic] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);


    useEffect(() => {
        if (!user) {
            navigate('/')
        }
    }, [user, navigate])

    if (!user) return null

    return (
        <div className='w-screen h-screen flex overflow-hidden'>
            <Navigation user={user} setUser={setUser} currentTopic={currentTopic} setCurrentTopic={setCurrentTopic} currentFolder={currentFolder} setCurrentFolder={setCurrentFolder}/>
            <Topic currentTopic={currentTopic} setCurrentTopic={setCurrentTopic} />
            <Chat currentTopic={currentTopic} setCurrentTopic={setCurrentTopic} currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} />
        </div>
    )
}

export default Home