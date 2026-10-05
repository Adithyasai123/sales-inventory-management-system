import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-[100dvh] w-full bg-bg overflow-hidden relative antialiased">
      {/* Fixed Desktop Sidebar (>=1024px) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Scrollable Main Area (ONLY this area scrolls) */}
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 lg:ml-[var(--sidebar-w)] bg-bg">
        {/* Mobile Top Navigation */}
        <MobileNav />

        {/* Main Content Viewport */}
        <main className="min-w-0 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
