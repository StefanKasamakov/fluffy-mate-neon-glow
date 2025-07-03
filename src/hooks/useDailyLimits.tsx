import { useState, useEffect } from 'react';

interface DailyLimits {
  superLikes: number;
  rewinds: number;
  lastReset: string;
}

const SUPER_LIKES_LIMIT = 1;
const REWINDS_LIMIT = 5;

export const useDailyLimits = () => {
  const [limits, setLimits] = useState<DailyLimits>({
    superLikes: 0,
    rewinds: 0,
    lastReset: new Date().toDateString()
  });

  useEffect(() => {
    const stored = localStorage.getItem('fluffyMatchDailyLimits');
    if (stored) {
      const parsedLimits: DailyLimits = JSON.parse(stored);
      const today = new Date().toDateString();
      
      if (parsedLimits.lastReset !== today) {
        // Reset limits for new day
        const resetLimits = {
          superLikes: 0,
          rewinds: 0,
          lastReset: today
        };
        setLimits(resetLimits);
        localStorage.setItem('fluffyMatchDailyLimits', JSON.stringify(resetLimits));
      } else {
        setLimits(parsedLimits);
      }
    }
  }, []);

  const updateLimits = (newLimits: Partial<DailyLimits>) => {
    const updated = { ...limits, ...newLimits };
    setLimits(updated);
    localStorage.setItem('fluffyMatchDailyLimits', JSON.stringify(updated));
  };

  const useSuperLike = () => {
    if (limits.superLikes >= SUPER_LIKES_LIMIT) return false;
    updateLimits({ superLikes: limits.superLikes + 1 });
    return true;
  };

  const useRewind = () => {
    if (limits.rewinds >= REWINDS_LIMIT) return false;
    updateLimits({ rewinds: limits.rewinds + 1 });
    return true;
  };

  const canUseSuperLike = limits.superLikes < SUPER_LIKES_LIMIT;
  const canUseRewind = limits.rewinds < REWINDS_LIMIT;

  return {
    superLikesUsed: limits.superLikes,
    rewindsUsed: limits.rewinds,
    canUseSuperLike,
    canUseRewind,
    useSuperLike,
    useRewind,
    superLikesRemaining: SUPER_LIKES_LIMIT - limits.superLikes,
    rewindsRemaining: REWINDS_LIMIT - limits.rewinds
  };
};