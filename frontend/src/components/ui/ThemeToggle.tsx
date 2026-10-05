import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'p-1.5 rounded-full text-muted hover:text-text hover:bg-surfaceAlt transition-colors flex items-center justify-center shrink-0 focus:outline-none focus:ring-1 focus:ring-border',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-accent transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
};
