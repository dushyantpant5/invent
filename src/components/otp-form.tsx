'use client';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { PasswordFactory } from '@/services/auth/password-factory/password.factory';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import OtpTimer from '@/components/otpTimer';

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: 'Your one-time password must be 6 characters.',
  }),
});

export default function InputOTPForm() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  const parsed = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : null;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const id = parsed.id;
    const otpResponse = await fetch(`../api/auth/otp?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await otpResponse.json();
    console.log('otpform in otpHash', response);
    const otpHashComp = await PasswordFactory.verify(data.pin, response.data.otpHash);
    const otpTimeExpires = new Date(response.data.expiresAt);
    const curentTime = new Date();
    const email = response.data.email;
    const idd = response.data.id;
    if (otpHashComp) {
      if (curentTime <= otpTimeExpires) {
        await fetch('../api/auth/otp', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, idd }),
        });
      } else {
        console.log('expired time');
      }
    } else {
      console.log('wrong otp');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6 mx-150 my-60">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Password</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Please enter the one-time password sent to your phone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {parsed?.emails ? (
          <OtpTimer emails={parsed.emails} />
        ) : (
          <p className="text-red-500">Email not found in URL</p>
        )}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
