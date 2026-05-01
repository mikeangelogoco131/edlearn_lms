import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Mic, MicOff, Video, VideoOff, Monitor, Hand, MessageSquare, Users, Settings, X, Send, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { api, ApiClassSession, ApiCourse } from '../lib/api';
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
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function safeDateTimeText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return String(value);
  }

  if (value instanceof Date) {
    return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return '';
}

function normalizeCourse(course: any): ApiCourse {
  return {
    id: safeText(course?.id),
    title: safeText(course?.title, 'Untitled Course'),
    code: safeText(course?.code, 'COURSE'),
    description: safeText(course?.description, ''),
    teacher: safeText(course?.teacher, ''),
    teacherId: course?.teacherId == null ? null : safeText(course?.teacherId),
    students: Number(course?.students ?? 0) || 0,
    term: safeText(course?.term, ''),
    section: safeText(course?.section, ''),
    schedule: safeText(course?.schedule, ''),
    status: safeText(course?.status, 'active'),
    nextClass: course?.nextClass == null ? null : safeText(course?.nextClass),
    materials: Number(course?.materials ?? 0) || 0,
    assignments: Number(course?.assignments ?? 0) || 0,
  };
}

function normalizeSession(session: any): ApiClassSession {
  return {
    id: safeText(session?.id),
    courseId: safeText(session?.courseId),
    title: safeText(session?.title, 'Live Session'),
    date: session?.date == null ? null : safeText(session?.date),
    time: session?.time == null ? null : safeText(session?.time),
    duration: session?.duration == null ? null : safeText(session?.duration),
    status: safeText(session?.status, 'scheduled'),
    attendees: session?.attendees == null ? null : Number(session?.attendees) || 0,
    startsAt: session?.startsAt == null ? null : safeText(session?.startsAt),
    endsAt: session?.endsAt == null ? null : safeText(session?.endsAt),
  };
}

export default function ClassroomPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [session, setSession] = useState<ApiClassSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!classId) return;
      setLoading(true);
      setError('');

      try {
        const courseRes = await api.course(classId);
        const nextCourse = normalizeCourse(courseRes.data);
        if (cancelled) return;
        setCourse(nextCourse);

        const sessionsRes = await api.courseSessions(nextCourse.id);
        const nextSessions = (Array.isArray(sessionsRes.data) ? sessionsRes.data : []).map(normalizeSession);
        const liveSession = nextSessions.find((item) => item.status === 'live') ?? nextSessions[0] ?? null;

        if (liveSession) {
          if (!cancelled) setSession(liveSession);
        } else if (user && (user.role === 'teacher' || user.role === 'admin')) {
          const now = new Date();
          const created = await api.createCourseSession(nextCourse.id, {
            title: `${nextCourse.code} Live Class`,
            starts_at: now.toISOString(),
            ends_at: new Date(now.getTime() + 60 * 60000).toISOString(),
            meeting_url: `/classroom/${nextCourse.id}`,
            status: 'live',
            notes: `Auto-created live session for ${nextCourse.code}.`,
          });
          if (!cancelled) setSession(normalizeSession(created.data));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load classroom');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [classId, user]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    async function loadMessages() {
      try {
        const res = await api.getClassroomMessages(session.id);
        if (!cancelled) {
          setMessages(
            (Array.isArray(res.data) ? res.data : []).map((msg: any) => ({
              id: safeText(msg?.id, `${Date.now()}`),
              userId: safeText(msg?.userId, ''),
              userName: safeText(msg?.userName, 'Unknown'),
              body: safeText(msg?.body, ''),
              createdAt: safeText(msg?.createdAt, new Date().toISOString()),
            }))
          );
        }
      } catch {
        // ignore
      }
    }

    async function loadParticipants() {
      try {
        const res = await api.getClassroomParticipants(session.id);
        if (!cancelled) {
          setParticipants(
            (Array.isArray(res.data) ? res.data : []).map((participant: any) => ({
              id: safeText(participant?.id, ''),
              name: safeText(participant?.name, 'Participant'),
              role: participant?.role === 'teacher' ? 'teacher' : 'student',
              isMuted: Boolean(participant?.isMuted),
              isVideoOn: Boolean(participant?.isVideoOn),
              isHandRaised: Boolean(participant?.isHandRaised),
            }))
          );
        }
      } catch {
        // ignore
      }
    }

    void loadMessages();
    void loadParticipants();
    const interval = window.setInterval(() => {
      void loadMessages();
      void loadParticipants();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session?.id]);

  const courseLabel = useMemo(() => {
    if (!course) return 'Live Session';
    return `${course.code} - ${course.title}`;
  }, [course]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !session?.id) return;
    const body = chatMessage.trim();
    setChatMessage('');

    try {
      const res = await api.sendClassroomMessage(session.id, body);
      setMessages((prev) => [
        ...prev,
        {
          id: safeText((res.data as any)?.id, `${Date.now()}`),
          userId: safeText((res.data as any)?.userId, user?.id || ''),
          userName: safeText((res.data as any)?.userName, user?.name || 'You'),
          body: safeText((res.data as any)?.body, body),
          createdAt: safeText((res.data as any)?.createdAt, new Date().toISOString()),
        },
      ]);
    } catch {
      // ignore send failure
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
      // ignore
    } finally {
      setEndingClass(false);
      navigate('/teacher');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-sm text-muted-foreground">Loading classroom…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="border-b border-border bg-background/70 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/teacher">
            <Button variant="ghost" size="sm" className="hover:bg-accent">
              <X className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </Link>
          <div>
            <div className="font-semibold">{courseLabel}</div>
            <div className="text-sm text-muted-foreground">Live Session</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm px-3 py-1.5 bg-muted rounded-lg">{participants.length} Participants</div>
          <div className={`text-sm px-3 py-1.5 rounded-lg ${session?.status === 'live' ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'}`}>
            {session?.status === 'live' ? 'Live' : safeText(session?.status, 'Session')}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid gap-4 h-full xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)]">
            <Card className="h-full overflow-hidden border-border">
              <CardContent className="p-0 h-full flex flex-col bg-slate-950">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
                  <div>
                    <div className="font-semibold">Live Meeting</div>
                    <div className="text-sm text-white/70">Interactive class room</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 px-2 py-1">Mic {isMuted ? 'Muted' : 'Live'}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">Camera {isVideoOn ? 'On' : 'Off'}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">Screen {isScreenSharing ? 'On' : 'Off'}</span>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-white/80">
                  <div className="text-center max-w-md space-y-3">
                    <div className="text-3xl font-semibold">{course ? course.title : 'Classroom'}</div>
                    <div className="text-sm text-white/60">
                      The classroom is ready. Use the controls below to manage your session while chat and participants remain on the side.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {showSidebar ? (
              <Card className="h-full overflow-hidden border-border">
                <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'chat' | 'participants')} className="h-full flex flex-col">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg">Classroom</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <TabsList className="grid grid-cols-2 mt-3">
                      <TabsTrigger value="chat">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="participants">
                        <Users className="w-4 h-4 mr-2" />
                        People
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                    <ScrollArea className="flex-1 px-4 pt-4">
                      <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className={`font-semibold text-sm ${msg.userId === user?.id ? 'text-blue-600' : ''}`}>{msg.userName}</span>
                              <span className="text-xs text-gray-500">{safeDateTimeText(msg.createdAt)}</span>
                            </div>
                            <div className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.body}</div>
                          </div>
                        ))}
                        {messages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Say hello!</div>
                        ) : null}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input placeholder="Type a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void handleSendMessage()} />
                        <Button size="icon" className="bg-blue-600 hover:bg-blue-700" onClick={() => void handleSendMessage()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="participants" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4 pt-4">
                      <div className="space-y-2 pb-4">
                        {participants.map((participant) => {
                          const initials = participant.name.split(' ').map((part) => part[0]).join('') || 'P';
                          return (
                            <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/40">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-blue-600 text-white text-sm">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{participant.name}</div>
                                  <div className="text-xs text-muted-foreground">{participant.role === 'teacher' ? 'Host' : 'Student'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {participant.isMuted ? <MicOff className="w-4 h-4 text-gray-400" /> : <Mic className="w-4 h-4 text-green-600" />}
                                {participant.isHandRaised ? <Hand className="w-4 h-4 text-yellow-500" /> : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={isMuted ? 'destructive' : 'secondary'} size="lg" onClick={() => setIsMuted((value) => !value)} className="gap-2">
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button variant={isVideoOn ? 'secondary' : 'destructive'} size="lg" onClick={() => setIsVideoOn((value) => !value)} className="gap-2">
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              {isVideoOn ? 'Stop Video' : 'Start Video'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setIsScreenSharing((value) => !value)} className="gap-2">
              <Monitor className="w-5 h-5" />
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </Button>
            <Button variant={isHandRaised ? 'default' : 'secondary'} size="lg" onClick={() => setIsHandRaised((value) => !value)} className="gap-2">
              <Hand className="w-5 h-5" />
              {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowSidebar((value) => !value)} className="gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat
            </Button>
            <Button variant="secondary" size="icon" className="w-12 h-12" onClick={() => setShowSidebar(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Button variant="destructive" size="lg" className="gap-2" onClick={() => void handleEndClass()} disabled={endingClass}>
            <Phone className="w-5 h-5" />
            {endingClass ? 'Ending...' : 'End Class'}
          </Button>
        </div>
      </div>
    </div>
  );
}
