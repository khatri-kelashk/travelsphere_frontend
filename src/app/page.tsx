// app/page.tsx
'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import Login from './containers/Login/index';
import Dashboard from './containers/Dashboard/index';
import { getHeadersForHttpReq } from '../constants/token'
import { API_URL } from '../constants'

const App = () => {
  const router = useRouter()
  const pathname = usePathname()

  const sleep = (duration: number) =>
    new Promise((resolve) => setTimeout(resolve, duration))

  const heartbeat = async () => {
    if (!localStorage.getItem('logger_id')) return
    
    const headers = getHeadersForHttpReq()
    const data = {
      id: localStorage.getItem('logger_id'),
      user_id: localStorage.getItem('user_id'),
    }

    try {
      const response = await axios.put(`${API_URL}api/outing_loggers/heartbeat`, data, { headers })
      if (!response.data.success) {
        handleLogout()
      }
    } catch (error) {
      console.error('Heart Beat Error:', error)
      handleLogout()
    }
  }

  const handleLogout = async () => {
    toast.info('System is going to Logout..')
    await sleep(2000)
    localStorage.clear()
    router.push('/login')
  }

  useEffect(() => {
    // Set up heartbeat interval
    const intervalId = setInterval(heartbeat, 20 * 1000)
    // Initial heartbeat
    heartbeat()

    return () => clearInterval(intervalId)
  }, [])

  // Redirect logic based on authentication status
  useEffect(() => {
    console.log({pathname, router});
    
    const isLoggedIn = !!localStorage.getItem('logger_id')
    
    if (pathname === '/' && isLoggedIn) {
      router.push('/dashboard')
    } else if (pathname.startsWith('/dashboard') && !isLoggedIn) {
      router.push('/login')
    }
  }, [pathname, router])

  return (
    <>
      {pathname === '/login' && <Login />}
      {pathname.startsWith('/dashboard') && <Dashboard />}
    </>
  )
}

export default App