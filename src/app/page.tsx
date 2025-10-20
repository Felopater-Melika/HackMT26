import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import auth from '@/lib/auth';

const ENABLE_AUTO_REDIRECT = true;

export default async function Home() {
  if (ENABLE_AUTO_REDIRECT) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session) {
      redirect('/app');
    } else {
      redirect('/app/signin');
    }
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Cliniq Care</h1>
    </div>
  );
}
