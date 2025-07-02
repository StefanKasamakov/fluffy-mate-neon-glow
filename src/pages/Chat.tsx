import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Phone, Video, MoreVertical, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Chat = () => {
  const { matchId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const loadMessages = async () => {
    if (!matchId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        text: msg.message_text,
        isOwner: msg.sender_user_id === user?.id,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      })) || [];

      setMessages(formattedMessages);

      // Mark unread messages as read when loading chat
      if (user && data?.length) {
        const unreadMessages = data.filter(msg => 
          msg.sender_user_id !== user.id && !msg.is_read
        );
        
        for (const msg of unreadMessages) {
          try {
            await supabase.rpc('mark_message_as_read', { message_id: msg.id });
          } catch (markError) {
            console.error('Error marking message as read:', markError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMatchData = async () => {
    if (!matchId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          pet1:pets!matches_pet1_id_fkey(
            pet_name,
            owner_name,
            verified,
            user_id,
            pet_photos(photo_url)
          ),
          pet2:pets!matches_pet2_id_fkey(
            pet_name,
            owner_name,
            verified,
            user_id,
            pet_photos(photo_url)
          )
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;

      // Determine which pet is the other user's pet
      const otherPet = data.pet1.user_id === user.id ? data.pet2 : data.pet1;
      
      setMatchData({
        id: data.id,
        petName: otherPet.pet_name,
        ownerName: otherPet.owner_name,
        photo: otherPet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop',
        verified: otherPet.verified || false,
        online: Math.random() > 0.5 // Mock online status
      });
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !matchId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_user_id: user.id,
          message_text: message.trim()
        });

      if (error) throw error;

      setMessage("");
      await loadMessages(); // Reload messages to show the new one
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    loadMatchData();
    loadMessages();
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Match not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Link to="/matches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={matchData.photo}
                alt={matchData.petName}
                className="w-10 h-10 object-cover rounded-full"
              />
              {matchData.verified && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                  ✓
                </Badge>
              )}
              {matchData.online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-card" />
              )}
            </div>
            
            <div>
              <p className="font-medium">{matchData.petName}</p>
              <p className="text-xs text-muted-foreground">{matchData.ownerName}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Match Info Banner */}
      <div className="p-4 bg-gradient-accent/10 border-b border-border">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-neon-pink" />
          <span className="text-sm">You and {matchData.petName} liked each other!</span>
          <Heart className="w-4 h-4 text-neon-pink" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwner ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] p-3 ${
              msg.isOwner 
                ? 'bg-gradient-primary text-primary-foreground border-0' 
                : 'bg-secondary border-border'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${
                msg.isOwner ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {msg.timestamp}
              </p>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-secondary border-border"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            size="sm"
            className="bg-gradient-primary hover:opacity-90 shadow-button"
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;