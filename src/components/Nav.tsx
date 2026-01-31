'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Scan, LayoutDashboard, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/trpc/react';

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();

  console.log('🔵 Nav component rendering');

  const {
    data: usage,
    isLoading,
    error,
  } = api.usage.getUsage.useQuery(undefined, {
    retry: false,
  });

  // Debug logging
  console.log('🔵 Nav - Usage query state:', {
    usage,
    isLoading,
    error: error?.message,
    hasData: !!usage,
    usageValue: usage ? `${usage.remaining}/${usage.limit}` : 'no data',
  });

  if (error) {
    console.error('❌ Nav - Usage query error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      shape: error.shape,
      data: error.data,
    });
  }

  console.log(
    '🔵 Nav - About to render, usage display will show:',
    usage
      ? `${usage.remaining}/${usage.limit}`
      : isLoading
        ? 'loading'
        : 'error/fallback'
  );

  const handleSignOut = async () => {
    try {
      // Call the sign-out endpoint
      await fetch('/api/auth/sign-out', {
        method: 'POST',
      });
      // Redirect to sign in page
      window.location.href = '/app/signin';
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still redirect even if there's an error
      window.location.href = '/app/signin';
    }
  };

  const navItems = [
    { href: '/app/scan', label: 'Scan', icon: Scan },
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/social', label: 'Community', icon: MessageSquare },
    { href: '/app/profile', label: 'Profile', icon: User },
  ];

  console.log('🔵 Nav - Rendering JSX');

  return (
    <nav className='border-b bg-background'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-6'>
          <Link
            href='/app'
            className='font-bold text-lg text-foreground hover:text-foreground/80'>
            Cliniq
          </Link>
          <div className='hidden items-center gap-1 sm:flex'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}>
                  <Icon className='h-4 w-4' />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {(() => {
            console.log('🔵 Nav - Rendering usage display, state:', {
              isLoading,
              error: !!error,
              usage: !!usage,
            });
            return (
              <div
                className='flex items-center gap-2 rounded-lg border-2 border-primary/20 bg-card px-3 py-1.5 text-sm shadow-sm'
                data-testid='usage-display'>
                <Scan className='h-4 w-4 shrink-0 text-primary' />
                <span className='hidden text-muted-foreground sm:inline'>
                  Scans:
                </span>
                {isLoading ? (
                  <span className='font-bold text-foreground'>...</span>
                ) : error ? (
                  <span
                    className='font-bold text-destructive'
                    title={error.message}>
                    0/3
                  </span>
                ) : usage ? (
                  <span
                    className={`font-bold ${
                      usage.hasReachedLimit
                        ? 'text-destructive'
                        : usage.remaining === 1
                          ? 'text-yellow-600'
                          : 'text-primary'
                    }`}>
                    {usage.remaining}/{usage.limit}
                  </span>
                ) : (
                  <span className='font-bold text-foreground'>3/3</span>
                )}
              </div>
            );
          })()}
          <ThemeToggle />
          <Button
            variant='ghost'
            onClick={handleSignOut}
            className='flex items-center gap-2'>
            <LogOut className='h-4 w-4' />
            <span className='hidden sm:inline'>Sign Out</span>
          </Button>
        </div>
      </div>
      {/* Mobile menu */}
      <div className='border-t sm:hidden'>
        <div className='flex items-center justify-around px-4 py-2'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                <Icon className='h-5 w-5' />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
