import React, { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router'
import axios from 'axios'

const SignUp = ({ user, setUser }) => {

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            navigate('/home')
        }
    }, [user, navigate])

    const usernameRef = useRef(null)
    const emailRef = useRef(null)
    const passwordRef = useRef(null)

    const handleSignUp = async () => {
        try {
            const username = usernameRef.current.value
            const email = emailRef.current.value
            const password = passwordRef.current.value

            const response = await axios.post(
                `${apiBaseUrl}/api/users/signup`,
                {
                    username,
                    email,
                    password
                }
            )

            // whatever your backend returns
            const { user, token } = response.data

            localStorage.setItem('token', token)
            setUser(user)

            navigate('/home')
        } catch (error) {
            console.error(error.response?.data || error.message)
        }
    }

    return (
        <div className='bg-[#f3e9dc] w-screen h-screen flex justify-center items-center'>
            <div className='p-4 bg-[#c08552] rounded-lg text-[#f3e9dc] flex flex-col'>
                
                <h1 className='font-bold text-2xl mb-4'>
                    caffeinated.ai | Sign Up
                </h1>

                <input
                    ref={usernameRef}
                    className='bg-[#f3e9dc] text-[#5e3023] rounded-md mb-2 px-2'
                    type="text"
                    placeholder="username"
                />

                <input
                    ref={emailRef}
                    className='bg-[#f3e9dc] text-[#5e3023] rounded-md mb-2 px-2'
                    type="email"
                    placeholder="email"
                />

                <input
                    ref={passwordRef}
                    className='bg-[#f3e9dc] text-[#5e3023] rounded-md mb-2 px-2'
                    type="password"
                    placeholder="new password"
                />

                <button
                    onClick={handleSignUp}
                    className='bg-[#895737] px-4 py-2 rounded-md'
                >
                    sign up
                </button>

                <Link to="/">
                    already have an account?
                    <span className='underline underline-offset-2 cursor-pointer'>
                        login
                    </span>
                </Link>
            </div>
        </div>
    )
}

export default SignUp