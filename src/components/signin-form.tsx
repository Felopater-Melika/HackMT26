'use client';
import type React from 'react';
import { useState } from 'react';
import { GalleryVerticalEnd } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 403) {
          setVerificationEmail(values.email);
          setShowVerification(true);
          return;
        }

        throw new Error(data?.message || 'Sign in failed');
      }

      router.push('/app');
    } catch (err: unknown) {
      setError('password', {
        message: err instanceof Error ? err.message : 'Sign in failed',
      });
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setResendLoading(true);
    setResendError(null);

    try {
      await authClient.sendVerificationEmail({ email: verificationEmail });
    } catch (err: any) {
      setResendError(err?.message || 'Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='flex size-8 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-6' />
          </div>
          <h1 className='text-xl font-bold'>Check your email</h1>
          <FieldDescription>
            We've sent a verification link to{' '}
            <strong>{verificationEmail}</strong>. Please check your inbox and
            click the link to verify your account.
          </FieldDescription>

          {resendError && (
            <FieldDescription className='text-red-600'>
              {resendError}
            </FieldDescription>
          )}

          <Button
            onClick={handleResendVerification}
            variant='outline'
            disabled={resendLoading}
            className='w-full'>
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          <FieldDescription>
            <a href='/app/signin'>Back to sign in</a>
          </FieldDescription>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className='flex flex-col items-center gap-2 text-center'>
            <a
              href='#'
              className='flex flex-col items-center gap-2 font-medium'>
              <div className='flex size-8 items-center justify-center rounded-md'>
                <GalleryVerticalEnd className='size-6' />
              </div>
              <span className='sr-only'>Cliniq</span>
            </a>
            <h1 className='text-xl font-bold'>Welcome back</h1>
            <FieldDescription>
              Don't have an account? <a href='/app/signup'>Sign up</a>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input
              id='email'
              type='email'
              placeholder='m@example.com'
              {...register('email')}
            />
            {errors.email?.message ? (
              <FieldDescription className='text-red-600'>
                {errors.email.message}
              </FieldDescription>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              {...register('password')}
            />
            <FieldDescription className='text-right'>
              <a href='/app/forgot-password'>Forgot password?</a>
            </FieldDescription>
            {errors.password?.message ? (
              <FieldDescription className='text-red-600'>
                {errors.password.message}
              </FieldDescription>
            ) : null}
          </Field>
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            Sign in
          </Button>
          <FieldSeparator>Or</FieldSeparator>
          <Field>
            <Button
              variant='outline'
              type='button'
              className='w-full bg-transparent'
              onClick={async () => {
                await authClient.signIn.social({
                  provider: 'google',
                  callbackURL: '/app',
                });
              }}>
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                <path
                  d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                  fill='currentColor'
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className='px-6 text-center'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
        and <a href='#'>Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
