'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { generateOtpUpdateTable } from '../utils/generateOtpAndUpdateTable';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignUpForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCpassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isMatch = password === cpassword;

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/auth/signUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }
      await generateOtpUpdateTable(email, router);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err instanceof Error) {
          setError(err.message); // Handle any errors
        } else {
          setError('An unknown error occurred');
        }
      }
    }
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4"></div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                  </div>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    onChange={(e) => setCpassword(e.target.value)}
                  />
                </div>
                {!isMatch && cpassword.length > 0 && (
                  <p className="text-red-500 text-sm">Passwords do not match</p>
                )}
                <Button
                  type="submit"
                  disabled={password === cpassword ? false : true}
                  className="w-full"
                >
                  Register
                </Button>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <a href="#" className="underline underline-offset-4">
                  Sign In
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
