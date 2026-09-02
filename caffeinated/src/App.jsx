import { useState } from 'react'
import { Routes, Route } from 'react-router';

// components/pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';

function App() {

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')

    if (!token) return null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))

        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          return null;
        }

        return {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        }
    } catch {
        localStorage.removeItem('token')
        return null
    }
  });

  return (

    <Routes>
      <Route path='/' element={<Login user={user} setUser={setUser} />} />
      <Route path='/signup' element={<SignUp user={user} />} />
      <Route path='/home' element={<Home user={user} setUser={setUser}/>} />
    </Routes>
  )
}

export default App
