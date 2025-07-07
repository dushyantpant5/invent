'use client';
import { useState } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SignUpFormProps = React.ComponentProps<'div'> & {
  onSignUp: (data: { email: string; password: string }) => void;
  mutateData: {
    isPending: boolean;
  };
};

export function SignUpForm({ className, onSignUp, mutateData, ...props }: SignUpFormProps) {
  const { isPending } = mutateData;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCpassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isMatch = password === cpassword;

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    onSignUp({ email, password });
  };

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
                  disabled={!isMatch || isPending || !email || !password || !cpassword}
                  className="w-full"
                >
                  {isPending ? 'Registering...' : 'Register'}
                </Button>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/signin" className="underline underline-offset-4">
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
