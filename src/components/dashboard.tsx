'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {api} from '@/trpc/react';

interface DashboardProps {
    profile: {
        id: string;
        age: number | null;
        gender: string | null;
        createdAt: Date | null;
    };
}

export function Dashboard({profile}: DashboardProps) {
    const {data: userConditions = []} =
        api.conditions.getUserConditions.useQuery();

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-7xl mx-auto'>
                <div className='mb-8 flex justify-between items-center'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-900'>
                            Welcome back to Cliniq Care
                        </h1>
                    </div>
                    <Link href='/app/profile'>
                        <Button variant='outline'>Edit Profile</Button>
                    </Link>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'></div>
            </div>
        </div>
    );
}
