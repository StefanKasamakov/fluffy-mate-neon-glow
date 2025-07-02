import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      // Count unread messages more efficiently using the new is_read field
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          pet1:pets!matches_pet1_id_fkey(user_id),
          pet2:pets!matches_pet2_id_fkey(user_id)
        `);

      if (!matches) return;

      // Filter matches where the user is involved
      const userMatches = matches.filter(match => 
        match.pet1.user_id === user.id || match.pet2.user_id === user.id
      );

      if (userMatches.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Count unread messages across all user's matches
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', userMatches.map(m => m.id))
        .neq('sender_user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    loadUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, refreshUnreadCount: loadUnreadCount };
};