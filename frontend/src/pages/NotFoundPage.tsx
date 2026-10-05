import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-forest-surface border border-forest-border flex items-center justify-center text-forest mb-4 font-serif text-2xl font-bold">
        404
      </div>
      <h1 className="font-serif text-2xl font-medium text-forest mb-1">Page Not Found</h1>
      <p className="text-xs text-forest-muted max-w-sm mb-6 leading-relaxed">
        The requested screen does not exist or has been relocated.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate('/dashboard')}
        leftIcon={<Home className="w-4 h-4" />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
