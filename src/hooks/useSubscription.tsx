import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  tier: string;
  status: string;
  hasUnlimitedSwipes: boolean;
  canSeeWhoLikedYou: boolean;
  hasBoost: boolean;
  hasPriorityLikes: boolean;
  canMessageBeforeMatch: boolean;
  hasReadReceipts: boolean;
  superLikesLimit: number;
  rewindsLimit: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    tier: 'free',
    status: 'inactive',
    hasUnlimitedSwipes: false,
    canSeeWhoLikedYou: false,
    hasBoost: false,
    hasPriorityLikes: false,
    canMessageBeforeMatch: false,
    hasReadReceipts: false,
    superLikesLimit: 1,
    rewindsLimit: 5
  });

  const getFeaturesByTier = (tier: string) => {
    switch (tier) {
      case 'plus':
        return {
          hasUnlimitedSwipes: true,
          canSeeWhoLikedYou: true,
          hasBoost: false,
          hasPriorityLikes: false,
          canMessageBeforeMatch: false,
          hasReadReceipts: false,
          superLikesLimit: 1,
          rewindsLimit: 5
        };
      case 'gold':
        return {
          hasUnlimitedSwipes: true,
          canSeeWhoLikedYou: true,
          hasBoost: true,
          hasPriorityLikes: false,
          canMessageBeforeMatch: false,
          hasReadReceipts: false,
          superLikesLimit: 5,
          rewindsLimit: 5
        };
      case 'platinum':
        return {
          hasUnlimitedSwipes: true,
          canSeeWhoLikedYou: true,
          hasBoost: true,
          hasPriorityLikes: true,
          canMessageBeforeMatch: true,
          hasReadReceipts: true,
          superLikesLimit: 5,
          rewindsLimit: 5
        };
      default:
        return {
          hasUnlimitedSwipes: false,
          canSeeWhoLikedYou: false,
          hasBoost: false,
          hasPriorityLikes: false,
          canMessageBeforeMatch: false,
          hasReadReceipts: false,
          superLikesLimit: 1,
          rewindsLimit: 5
        };
    }
  };

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;

      try {
        // Get subscription tier
        const { data: tierData, error: tierError } = await supabase.rpc('get_user_subscription_tier');
        if (tierError) {
          console.error('Error fetching subscription tier:', tierError);
          return;
        }

        const tier = tierData || 'free';
        const features = getFeaturesByTier(tier);

        // Get subscription status
        const { data: statusData } = await supabase
          .from('user_subscription_status')
          .select('subscription_status')
          .eq('user_id', user.id)
          .maybeSingle();

        setSubscriptionStatus({
          tier,
          status: statusData?.subscription_status || 'inactive',
          ...features
        });
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  const initializeUserSubscription = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_subscription_status')
        .upsert({
          user_id: user.id,
          subscription_tier: 'free',
          subscription_status: 'inactive'
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error initializing user subscription:', error);
      }
    } catch (error) {
      console.error('Error initializing subscription:', error);
    }
  };

  useEffect(() => {
    if (user) {
      initializeUserSubscription();
    }
  }, [user]);

  return subscriptionStatus;
};