import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      // Get user's matches
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

      let totalUnread = 0;

      // For each match, count unread messages
      for (const match of userMatches) {
        const { data: messages } = await supabase
          .from('messages')
          .select('sender_user_id')
          .eq('match_id', match.id)
          .neq('sender_user_id', user.id); // Messages not sent by current user

        if (messages) {
          totalUnread += messages.length;
        }
      }

      setUnreadCount(totalUnread);
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