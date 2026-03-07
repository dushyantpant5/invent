'use client';
import { GalleryVerticalEnd } from 'lucide-react';
import Link from 'next/link';

import { SignUpForm } from '@/components/signup-form';
import { useRequestSignUp } from '@/features/auth/auth.queries';

export default function SignUp() {
  const { mutate: requestSignUp, isPending } = useRequestSignUp();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Invent.
        </Link>
        <SignUpForm onSignUp={requestSignUp} mutateData={{ isPending }} />
      </div>
    </div>
  );
}
