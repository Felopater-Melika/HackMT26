'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authClient.forgetPassword({ email });
      setIsSent(true);
    } catch (error) {
      console.error('Failed to send reset email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className='text-center'>
        <h2>Check your email</h2>
        <p>We've sent a password reset link to {email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor='email'>Email</FieldLabel>
        <Input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='m@example.com'
          required
        />
      </Field>
      <Button type='submit' className='w-full' disabled={isLoading}>
        Send Reset Link
      </Button>
    </form>
  );
}
