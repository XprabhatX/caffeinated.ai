import React, { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router'
import axios from 'axios'

const Login = ({ user, setUser }) => {

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const navigate = useNavigate()

    const emailRef = useRef(null)
    const passwordRef = useRef(null)

    useEffect(() => {
        if (user) {
            navigate('/home')
        }
    }, [user, navigate])

    const handleLogin = async () => {
        try {
            const email = emailRef.current.value
            const password = passwordRef.current.value

            const response = await axios.post(
                `${apiBaseUrl}/api/users/login`,
                {
                    email,
                    password
                }
            )

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
                    caffeinated.ai | Login
                </h1>

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
                    placeholder="password"
                />

                <button
                    onClick={handleLogin}
                    className='bg-[#895737] px-4 py-2 rounded-md'
                >
                    log in
                </button>

                <Link to="/signup">
                    don't have an account?
                    <span className='underline underline-offset-2 cursor-pointer'>
                        sign up
                    </span>
                </Link>

            </div>
        </div>
    )
}

export default Login