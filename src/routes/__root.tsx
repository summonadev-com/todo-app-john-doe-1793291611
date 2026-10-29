import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
      <p className="text-lg">This page does not exist.</p>
      <Link to="/" className="text-sm text-[#0078d4] underline underline-offset-4">
        Go to the overview
      </Link>
    </div>
  );
}
