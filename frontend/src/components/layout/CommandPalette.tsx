import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Package,
  Users,
  Layers,
  CheckSquare,
  Sliders,
  UserCheck,
  Activity,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const actions = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      run: () => navigate('/dashboard'),
    },
    {
      id: 'nav-orders',
      label: 'Go to Sales Orders',
      category: 'Navigation',
      icon: ShoppingCart,
      run: () => navigate('/orders'),
    },
    {
      id: 'action-create-order',
      label: 'Create New Sales Order',
      category: 'Quick Action',
      icon: PlusCircle,
      run: () => navigate('/orders/create'),
    },
    {
      id: 'nav-products',
      label: 'Go to Products Catalog',
      category: 'Navigation',
      icon: Package,
      run: () => navigate('/products'),
    },
    {
      id: 'nav-customers',
      label: 'Go to Customers',
      category: 'Navigation',
      icon: Users,
      run: () => navigate('/customers'),
    },
    {
      id: 'nav-inventory',
      label: 'Go to Inventory Ledger',
      category: 'Navigation',
      icon: Layers,
      run: () => navigate('/inventory'),
    },
    {
      id: 'nav-approvals',
      label: 'Go to Approvals Queue',
      category: 'Navigation',
      icon: CheckSquare,
      run: () => navigate('/approvals'),
    },
    {
      id: 'nav-users',
      label: 'Go to User Administration',
      category: 'Navigation',
      icon: UserCheck,
      run: () => navigate('/users'),
    },
    {
      id: 'nav-audit',
      label: 'Go to Audit & Notification Logs',
      category: 'Navigation',
      icon: Activity,
      run: () => navigate('/audit'),
    },
    {
      id: 'nav-settings',
      label: 'Go to System Settings',
      category: 'Navigation',
      icon: Sliders,
      run: () => navigate('/settings'),
    },
    {
      id: 'action-toggle-theme',
      label: `Switch Theme (Current: ${theme === 'dark' ? 'Dark' : 'Light'})`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => toggleTheme(),
    },
  ];

  const filteredActions = actions.filter((act) =>
    act.label.toLowerCase().includes(query.toLowerCase()) ||
    act.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = filteredActions[selectedIndex];
        if (action) {
          action.run();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl bg-surface border border-border rounded-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surfaceAlt/40">
          <Search className="w-4 h-4 text-textMuted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a screen, action, or command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-text placeholder:text-textMuted focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-textMuted">
            ESC
          </kbd>
        </div>

        {/* Action Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-caption text-textMuted">
              No matching screens or actions found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-accent text-accentText'
                      : 'hover:bg-surfaceAlt text-text'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-accentText' : 'text-textMuted'}`} />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-black/20 text-accentText'
                          : 'bg-surfaceAlt text-textMuted border border-border/80'
                      }`}
                    >
                      {action.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${isSelected ? 'block' : 'hidden'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-surfaceAlt/60 border-t border-border text-[11px] text-textMuted">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-medium">SIMS Spotlight</span>
        </div>
      </div>
    </div>
  );
};
