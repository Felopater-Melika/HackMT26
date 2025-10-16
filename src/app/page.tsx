import Link from 'next/link';

import { HydrateClient, api } from '@/trpc/server';

export default async function Home() {
  return (
    <HydrateClient>
      <div className='p-8'>
        <h1 className='text-2xl font-bold mb-4'>Cliniq Care</h1>
      </div>
    </HydrateClient>
  );
}
