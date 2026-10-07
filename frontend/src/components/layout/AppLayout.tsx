import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { ContentLoader } from '../ui/Loader';

export const AppLayout: React.FC = () => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          <Suspense fallback={<ContentLoader message="Loading..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Global Spotlight Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};
