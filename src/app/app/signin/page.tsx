import { SigninForm } from '@/components/signin-form';

export default function SigninPage() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <SigninForm />
      </div>
    </div>
  );
}
