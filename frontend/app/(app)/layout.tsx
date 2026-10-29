import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/backend';
import { MobileNav } from '@/components/mobile-nav';
import { LiveLocationTracker } from '@/components/live-location-tracker';
import { AppTopbar } from '@/components/app-topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/sign-in');
  if (!profile.profileComplete) redirect('/onboarding');

  return (
    <div className="app-shell">
      <LiveLocationTracker />
      <MobileNav />
      <div className="app-main">
        <AppTopbar />
        <div className="app-page-content">{children}</div>
      </div>
    </div>
  );
}
