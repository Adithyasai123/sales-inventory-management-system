import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
      <EmptyState
        animation="not-found"
        title="404 — Page Not Found"
        description="The requested screen does not exist, has been relocated, or is unavailable."
        actionLabel="Return to Dashboard"
        onAction={() => navigate('/dashboard')}
        className="max-w-md w-full"
      />
    </div>
  );
};
