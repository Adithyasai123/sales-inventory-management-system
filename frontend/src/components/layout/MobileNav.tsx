import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { SimsLogo } from '../ui/SimsLogo';
import { ThemeToggle } from '../ui/ThemeToggle';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-3 bg-surface text-text rounded-card mb-3 border border-border shadow-card shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <SimsLogo size={28} />
          <span className="text-title tracking-tight text-text">
            SIMS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Drawer Overlay for Mobile (<1024px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content: fixed, full height (100dvh) */}
          <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] h-[100dvh] bg-sidebar shadow-xl flex flex-col z-50 border-r border-border animate-in slide-in-from-left duration-200">
            <Sidebar
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
