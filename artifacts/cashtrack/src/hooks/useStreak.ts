import { useEffect, useState } from 'react';
import type { Streak } from '@/types';
import { fetchStreak } from '@/data';

interface UseStreakResult {
  streak: Streak | null;
  isLoading: boolean;
}

export function useStreak(): UseStreakResult {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchStreak().then((data) => {
      if (active) {
        setStreak(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { streak, isLoading };
}
