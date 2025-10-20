import { api } from '@/trpc/server';
import { OnboardingWrapper } from '@/components/onboarding-wrapper';
import { Dashboard } from '@/components/dashboard';
import { redirect } from 'next/navigation';

export default async function AppPage() {
  try {
    const onboardingStatus = await api.profile.getOnboardingStatus();

    if (!onboardingStatus.isOnboarded) {
      return <OnboardingWrapper />;
    }

    return <Dashboard profile={onboardingStatus.profile!} />;
  } catch (error) {
    console.error('Authentication error:', error);
    redirect('/signin');
  }
}
