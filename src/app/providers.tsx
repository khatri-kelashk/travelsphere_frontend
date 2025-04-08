'use client'

import { ReactNode, useEffect } from 'react'
import axios from 'axios'
import { useToast } from '@/components/ui/use-toast'
import {getHeadersForHttpReq} from '../constants/token'
import {API_URL} from '../constants'

export function Providers({ children }: { children: ReactNode }) {
  const { toast } = useToast()

  useEffect(() => {
    const heartbeat = async () => {
      if (!localStorage.getItem('logger_id')) return
      
      const headers = getHeadersForHttpReq()
      const data = {
        id: localStorage.getItem('logger_id'),
        user_id: localStorage.getItem('user_id'),
      }

      try {
        const response = await axios.put(`${API_URL}api/outing_loggers/heartbeat`, data, { headers })
        const { success } = response.data
        
        if (!success) {
          toast({
            title: 'Session Expired',
            description: 'System is going to Logout..',
            duration: 3000,
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          localStorage.clear()
          window.location.reload()
        }
      } catch (error) {
        console.error('Heart Beat Error:', error)
        if (error.response?.status) {
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "System is going to Logout..",
            duration: 3000,
          })
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          localStorage.clear()
          window.location.reload()
        }
      }
    }

    const intervalId = setInterval(heartbeat, 20 * 1000)
    heartbeat() // Call immediately

    return () => clearInterval(intervalId)
  }, [toast])

  return <>{children}</>
}