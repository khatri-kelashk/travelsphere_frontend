// app/containers/Login/index.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function Login() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = () => {
    // Your login logic here
    toast({
      title: 'Login Successful',
      description: 'Redirecting to dashboard...',
    })
    router.push('/dashboard')
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Email" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Password" />
            </div>
            <Button onClick={handleLogin}>Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}