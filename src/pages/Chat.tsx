import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Phone, Video, MoreVertical, Heart } from "lucide-react";

const Chat = () => {
  const { matchId } = useParams();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages] = useState([
    {
      id: 1,
      text: "Hi! Luna looks amazing, would love to arrange a meetup!",
      sender: "them",
      timestamp: "2:30 PM",
      isOwner: false
    },
    {
      id: 2,
      text: "Thank you! Your pet is beautiful too. I'd love to meet up and see if they get along.",
      sender: "me",
      timestamp: "2:32 PM",
      isOwner: true
    },
    {
      id: 3,
      text: "Perfect! Luna is very social and loves meeting new friends. Do you have any health certificates?",
      sender: "them",
      timestamp: "2:35 PM",
      isOwner: false
    },
    {
      id: 4,
      text: "Yes, all vaccinations are up to date and I have the certificates. Would next weekend work?",
      sender: "me",
      timestamp: "2:37 PM",
      isOwner: true
    },
    {
      id: 5,
      text: "That sounds perfect! Should we meet at Central Park?",
      sender: "them",
      timestamp: "2:40 PM",
      isOwner: false
    }
  ]);

  const match = {
    id: 1,
    petName: "Luna",
    ownerName: "Sarah M.",
    breed: "Golden Retriever",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop",
    verified: true,
    online: true
  };

  const sendMessage = () => {
    if (message.trim()) {
      // In real app, this would send to backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                src={match.photo}
                alt={match.petName}
                className="w-10 h-10 object-cover rounded-full"
              />
              {match.verified && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                  ✓
                </Badge>
              )}
              {match.online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-card" />
              )}
            </div>
            
            <div>
              <p className="font-medium">{match.petName}</p>
              <p className="text-xs text-muted-foreground">{match.ownerName}</p>
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
          <span className="text-sm">You and {match.petName} liked each other!</span>
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