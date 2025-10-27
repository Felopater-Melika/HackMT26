'use client';

import {useRouter} from 'next/navigation';
import {OnboardingForm} from '@/components/onboarding-form';

export function OnboardingWrapper() {
    const router = useRouter();

    const handleComplete = () => {
        router.refresh();
    };

    return <OnboardingForm onComplete={handleComplete}/>;
}
