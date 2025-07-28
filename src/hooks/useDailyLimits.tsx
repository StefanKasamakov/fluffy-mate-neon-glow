import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DailyLimits {
  superLikes: number;
  rewinds: number;
  lastReset: string;
}

interface SubscriptionLimits {
  superLikesLimit: number;
  rewindsLimit: number;
  hasUnlimitedSwipes: boolean;
  canSeeWhoLikedYou: boolean;
  hasBoost: boolean;
  hasPriorityLikes: boolean;
  canMessageBeforeMatch: boolean;
  hasReadReceipts: boolean;
}

const getSubscriptionLimits = (tier: string): SubscriptionLimits => {
  switch (tier) {
    case 'plus':
      return {
        superLikesLimit: 1,
        rewindsLimit: 5, // Free limits for rewinds in Plus
        hasUnlimitedSwipes: true,
        canSeeWhoLikedYou: true,
        hasBoost: false,
        hasPriorityLikes: false,
        canMessageBeforeMatch: false,
        hasReadReceipts: false
      };
    case 'gold':
      return {
        superLikesLimit: 5,
        rewindsLimit: 5,
        hasUnlimitedSwipes: true,
        canSeeWhoLikedYou: true,
        hasBoost: true,
        hasPriorityLikes: false,
        canMessageBeforeMatch: false,
        hasReadReceipts: false
      };
    case 'platinum':
      return {
        superLikesLimit: 5,
        rewindsLimit: 5,
        hasUnlimitedSwipes: true,
        canSeeWhoLikedYou: true,
        hasBoost: true,
        hasPriorityLikes: true,
        canMessageBeforeMatch: true,
        hasReadReceipts: true
      };
    default: // free
      return {
        superLikesLimit: 1,
        rewindsLimit: 5,
        hasUnlimitedSwipes: false,
        canSeeWhoLikedYou: false,
        hasBoost: false,
        hasPriorityLikes: false,
        canMessageBeforeMatch: false,
        hasReadReceipts: false
      };
  }
};

export const useDailyLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<DailyLimits>({
    superLikes: 0,
    rewinds: 0,
    lastReset: new Date().toDateString()
  });
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_subscription_tier');
        if (!error && data) {
          setSubscriptionTier(data);
        }
      } catch (error) {
        console.error('Error fetching subscription tier:', error);
      }
    };

    fetchSubscriptionTier();
  }, [user]);

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

  const subscriptionLimits = getSubscriptionLimits(subscriptionTier);

  const useSuperLike = () => {
    if (limits.superLikes >= subscriptionLimits.superLikesLimit) return false;
    updateLimits({ superLikes: limits.superLikes + 1 });
    return true;
  };

  const useRewind = () => {
    if (limits.rewinds >= subscriptionLimits.rewindsLimit) return false;
    updateLimits({ rewinds: limits.rewinds + 1 });
    return true;
  };

  const canUseSuperLike = limits.superLikes < subscriptionLimits.superLikesLimit;
  const canUseRewind = limits.rewinds < subscriptionLimits.rewindsLimit;

  return {
    superLikesUsed: limits.superLikes,
    rewindsUsed: limits.rewinds,
    canUseSuperLike,
    canUseRewind,
    useSuperLike,
    useRewind,
    superLikesRemaining: subscriptionLimits.superLikesLimit - limits.superLikes,
    rewindsRemaining: subscriptionLimits.rewindsLimit - limits.rewinds,
    subscriptionTier,
    subscriptionLimits
  };
};