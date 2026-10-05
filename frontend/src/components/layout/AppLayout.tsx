import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-forest-bg p-3 flex flex-col antialiased">
      {/* Mobile Top Navigation */}
      <MobileNav />

      {/* Main Flex App Shell */}
      <div className="flex-1 flex gap-3 h-[calc(100vh-24px)] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 bg-white rounded-card border border-forest-border/80 shadow-flat overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
