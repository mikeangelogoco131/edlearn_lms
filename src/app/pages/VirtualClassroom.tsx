import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Hand, MessageSquare, Users, 
  Settings, LogOut, MoreVertical, Grid, Maximize, PenTool, X, Send, Phone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { api, ApiCourse } from '../lib/api';

interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export default function VirtualClassroom() {
  const { classId } = useParams();
  const [course, setCourse] = useState<ApiCourse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!classId) return;
      try {
        const res = await api.course(classId);
        if (!cancelled) setCourse(res.data);
      } catch {
        if (!cancelled) setCourse(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [classId]);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');

  const [participants] = useState<Participant[]>([
    { id: '1', name: 'Prof. Sarah Johnson', role: 'teacher', isMuted: false, isVideoOn: true, isHandRaised: false },
    { id: '2', name: 'Alex Martinez', role: 'student', isMuted: true, isVideoOn: true, isHandRaised: false },
    { id: '3', name: 'Emma Wilson', role: 'student', isMuted: true, isVideoOn: true, isHandRaised: false },
    { id: '4', name: 'James Brown', role: 'student', isMuted: true, isVideoOn: false, isHandRaised: false },
    { id: '5', name: 'Sophia Chen', role: 'student', isMuted: true, isVideoOn: true, isHandRaised: true },
    { id: '6', name: 'Michael Johnson', role: 'student', isMuted: true, isVideoOn: true, isHandRaised: false },
  ]);

  const [chatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Prof. Sarah Johnson', message: 'Welcome everyone! Let\'s begin today\'s session.', timestamp: '09:00 AM' },
    { id: '2', sender: 'Alex Martinez', message: 'Good morning, Professor!', timestamp: '09:01 AM' },
    { id: '3', sender: 'Emma Wilson', message: 'Can you share your screen?', timestamp: '09:02 AM' },
    { id: '4', sender: 'Prof. Sarah Johnson', message: 'Yes, sharing now...', timestamp: '09:02 AM' },
  ]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // In production, this would send the message to the server
      setChatMessage('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <div className="border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/teacher">
            <Button variant="ghost" size="sm" className="hover:bg-accent">
              <X className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </Link>
          <div>
            <div className="font-semibold">{course?.code} - {course?.title}</div>
            <div className="text-sm text-muted-foreground">Live Session</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Recording</span>
          </div>
          <div className="text-sm px-3 py-1.5 bg-muted rounded-lg">
            {participants.length} Participants
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {participants.map((participant) => (
              <Card key={participant.id} className="relative bg-card border-border overflow-hidden">
                <CardContent className="p-0 h-full min-h-[200px] flex items-center justify-center">
                  {participant.isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-6xl font-bold">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="bg-gray-600 text-white text-2xl">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{participant.name}</span>
                        {participant.role === 'teacher' && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!participant.isMuted ? (
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <Mic className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {participant.isHandRaised && (
                          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Hand className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* More Options */}
                  <div className="absolute top-2 right-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-card border-l border-border flex flex-col">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 m-4">
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4 mr-2" />
                  People
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 pb-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-sm">{msg.sender}</span>
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
                        </div>
                        <div className="text-sm text-gray-700">{msg.message}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button 
                      size="icon" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendMessage}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="flex-1 m-0">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-2 pb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {participants.length} participants
                    </div>
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-600 text-white text-sm">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{participant.name}</div>
                            {participant.role === 'teacher' && (
                              <div className="text-xs text-gray-500">Host</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!participant.isMuted ? (
                            <Mic className="w-4 h-4 text-green-600" />
                          ) : (
                            <MicOff className="w-4 h-4 text-gray-400" />
                          )}
                          {participant.isHandRaised && (
                            <Hand className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className="gap-2"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <Button
              variant={isVideoOn ? "secondary" : "destructive"}
              size="lg"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="gap-2"
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              {isVideoOn ? 'Stop Video' : 'Start Video'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className="gap-2"
            >
              <Monitor className="w-5 h-5" />
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </Button>

            <Button
              variant={isHandRaised ? "default" : "secondary"}
              size="lg"
              onClick={() => setIsHandRaised(!isHandRaised)}
              className="gap-2"
            >
              <Hand className="w-5 h-5" />
              {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <PenTool className="w-5 h-5" />
              Whiteboard
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowSidebar(!showSidebar)}
              className="gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Chat
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <Grid className="w-5 h-5" />
              View
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="w-12 h-12"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Link to="/teacher">
            <Button
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Phone className="w-5 h-5" />
              End Class
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
