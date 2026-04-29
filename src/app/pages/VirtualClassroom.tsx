import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
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
import { api, ApiCourse, ApiClassSession } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [session, setSession] = useState<ApiClassSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!classId) return;
      try {
        // Try to load as a course first (legacy/fallback)
        const res = await api.course(classId);
        if (!cancelled) {
          setCourse(res.data);
          // If we found a course, also try to find the "live" session for it
          const sessionsRes = await api.courseSessions(res.data.id);
          const live = sessionsRes.data.find(s => s.status === 'live') || sessionsRes.data[0];
          if (live) {
            setSession(live);
          } else if (user && (user.role === 'teacher' || user.role === 'admin')) {
            const now = new Date();
            const created = await api.createCourseSession(res.data.id, {
              title: `${res.data.code} Live Class`,
              starts_at: now.toISOString(),
              ends_at: new Date(now.getTime() + 60 * 60000).toISOString(),
              meeting_url: `/classroom/${res.data.id}`,
              status: 'live',
              notes: `Auto-created live session for ${res.data.code}.`,
            });
            if (!cancelled) setSession(created.data);
          }
        }
      } catch {
        if (!cancelled) setCourse(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [classId, user]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    async function loadMessages() {
      try {
        const res = await api.getClassroomMessages(session!.id);
        if (!cancelled) setMessages(res.data);
      } catch {
        // ignore
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.id]);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'speaker'>('grid');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');

  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    async function loadParticipants() {
      try {
        const res = await api.getClassroomParticipants(session!.id);
        if (!cancelled) setParticipants(res.data);
      } catch {
        // ignore
      }
    }

    loadParticipants();
    const interval = setInterval(loadParticipants, 10000); // Poll participants every 10s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.id]);

  const handleSendMessage = async () => {
    if (chatMessage.trim() && session?.id) {
      const body = chatMessage.trim();
      setChatMessage('');
      try {
        const res = await api.sendClassroomMessage(session.id, body);
        setMessages(prev => [...prev, res.data]);
      } catch {
        // failed to send
      }
    }
  };

  const handleEndClass = async () => {
    if (!course?.id || !session?.id) {
      navigate('/teacher');
      return;
    }

    setEndingClass(true);
    try {
      await api.updateCourseSession(course.id, session.id, {
        status: 'completed',
        notes: `Ended from live classroom by ${user?.name || 'teacher'}.`,
      });
    } catch {
      // keep navigation even if backend is unavailable
    } finally {
      setEndingClass(false);
      navigate('/teacher');
    }
  };

  const handleToggleView = () => {
    setLayoutMode((mode) => (mode === 'grid' ? 'speaker' : 'grid'));
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
          <div className={`text-sm px-3 py-1.5 rounded-lg ${session?.status === 'live' ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'}`}>
            {session?.status === 'live' ? 'Live' : session?.status || 'Session'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          {showWhiteboard ? (
            <Card className="h-full bg-card border-border overflow-hidden">
              <CardContent className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-lg font-semibold">Whiteboard</div>
                    <div className="text-sm text-muted-foreground">Live class notes and prompts</div>
                  </div>
                  <Button variant="outline" onClick={() => setShowWhiteboard(false)}>
                    Close Whiteboard
                  </Button>
                </div>
                <div className="flex-1 rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white overflow-auto">
                  <div className="space-y-4 max-w-2xl">
                    <div className="text-2xl font-semibold">Class Focus</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/10 p-4">
                        <div className="text-sm text-white/70">Topic</div>
                        <div className="font-medium">{course?.title || 'Live class topic'}</div>
                      </div>
                      <div className="rounded-xl bg-white/10 p-4">
                        <div className="text-sm text-white/70">Participants</div>
                        <div className="font-medium">{participants.length} active learners</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4 min-h-52">
                      <div className="text-sm text-white/70 mb-3">Notes</div>
                      <div className="space-y-2 text-white/90">
                        <p>Use this space to guide discussion, sketch solutions, or post quick reminders during the live class.</p>
                        <p>Screen share, chat, and participant controls remain available while the whiteboard is open.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 h-full ${layoutMode === 'speaker' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {participants.map((participant, index) => (
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
          )}
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
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-semibold text-sm ${msg.userId === user?.id ? 'text-blue-600' : ''}`}>{msg.userName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-sm text-foreground/80">{msg.body}</div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Say hello!</div>
                    )}
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
              onClick={() => setShowWhiteboard((prev) => !prev)}
              className="gap-2"
            >
              <PenTool className="w-5 h-5" />
              {showWhiteboard ? 'Close Whiteboard' : 'Whiteboard'}
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
              onClick={handleToggleView}
              className="gap-2"
            >
              {layoutMode === 'grid' ? <Grid className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              {layoutMode === 'grid' ? 'Grid View' : 'Speaker View'}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="w-12 h-12"
              onClick={() => setShowSettingsPanel((prev) => !prev)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="destructive"
            size="lg"
            className="gap-2"
            onClick={() => void handleEndClass()}
            disabled={endingClass}
          >
            <Phone className="w-5 h-5" />
            {endingClass ? 'Ending...' : 'End Class'}
          </Button>
        </div>
      </div>

      {showSettingsPanel && (
        <div className="absolute right-4 bottom-24 z-20 w-80 rounded-2xl border border-border bg-card shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Live Class Settings</div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettingsPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">Course:</span> {course?.code} - {course?.title}</div>
            <div><span className="font-medium text-foreground">Session:</span> {session?.status || 'unknown'}</div>
            <div><span className="font-medium text-foreground">Screen sharing:</span> {isScreenSharing ? 'On' : 'Off'}</div>
            <div><span className="font-medium text-foreground">Mic:</span> {isMuted ? 'Muted' : 'Live'}</div>
            <div><span className="font-medium text-foreground">Camera:</span> {isVideoOn ? 'On' : 'Off'}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSidebar(true)}>Show Chat</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowWhiteboard((prev) => !prev)}>Whiteboard</Button>
          </div>
        </div>
      )}
    </div>
  );
}
