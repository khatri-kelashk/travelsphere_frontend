// app/components/RouteNotFound/index.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RocketIcon } from '@radix-ui/react-icons'

export default function RouteNotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Alert className="w-[400px]">
        <RocketIcon className="h-4 w-4" />
        <AlertTitle>Page Not Found</AlertTitle>
        <AlertDescription>
          The page you're looking for doesn't exist.
        </AlertDescription>
      </Alert>
      <Button onClick={() => router.push('/')}>
        Return to Home
      </Button>
    </div>
  )
}