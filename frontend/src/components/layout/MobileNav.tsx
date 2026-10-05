import React, { useState } from 'react';
import { Menu, X, Boxes } from 'lucide-react';
import { Sidebar } from './Sidebar';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-3 bg-forest text-white rounded-card mb-3 shadow-flat">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-mint-primary text-forest-dark flex items-center justify-center font-bold text-sm">
            <Boxes className="w-4 h-4 text-forest-dark" />
          </div>
          <div>
            <span className="font-serif text-base font-medium tracking-tight">SIMS</span>
            <span className="text-[10px] text-forest-border block -mt-1">
              Sales & Inventory
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-white/10 text-forest-surface transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Drawer Overlay for Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-forest/50 backdrop-blur-xs transition-opacity duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-3 left-3 z-50 w-72 max-w-[calc(100vw-24px)] flex">
            <div className="w-full flex" onClick={() => setIsOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
