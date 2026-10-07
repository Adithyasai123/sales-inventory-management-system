import React, { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEventLoader } from '../../context/EventLoadingContext';

export const TopProgressBar: React.FC = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const { isGlobalMutating, isGlobalFetching } = useEventLoader();

  const isActive = isFetching > 0 || isMutating > 0 || isGlobalMutating || isGlobalFetching;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      setVisible(true);
    } else {
      timer = setTimeout(() => {
        setVisible(false);
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isActive]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="System loading indicator"
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none overflow-hidden bg-transparent"
    >
      <div className="w-full h-full relative overflow-hidden bg-accent/20">
        <div className="absolute top-0 bottom-0 bg-accent shadow-[0_0_12px_var(--color-accent)] animate-top-progress" />
        <div className="absolute top-0 bottom-0 bg-accent/80 shadow-[0_0_8px_var(--color-accent)] animate-top-progress-short" />
      </div>
    </div>
  );
};
