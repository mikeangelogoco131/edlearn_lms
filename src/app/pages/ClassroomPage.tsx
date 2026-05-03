import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Mic, MicOff, Video, VideoOff, Monitor, Hand, MessageSquare, Users, Settings, X, Send, Phone, LayoutGrid, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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
    meetingUrl: session?.meetingUrl == null ? null : safeText(session?.meetingUrl),
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
  const [meetingStatus, setMeetingStatus] = useState('Preparing live room...');
  const [meetingReady, setMeetingReady] = useState(false);
  const [isTileView, setIsTileView] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const meetingContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const meetingJoinUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/classroom/${classId || ''}`;
    const roomPath = session?.meetingUrl || `/classroom/${classId || ''}`;
    return roomPath.startsWith('http') ? roomPath : `${window.location.origin}${roomPath}`;
  }, [classId, session?.meetingUrl]);

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
        jitsiApiRef.current = null;
      }
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        try {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        screenStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!classId || !meetingContainerRef.current) return;

    let cancelled = false;
    const roomName = `edlearn-${String(classId)}`.replace(/[^a-zA-Z0-9_-]/g, '-');

    const cleanup = () => {
      setMeetingReady(false);
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
        jitsiApiRef.current = null;
      }
    };

    const initMeeting = () => {
      if (cancelled || !meetingContainerRef.current) return;

      const JitsiAPI = (window as Window & { JitsiMeetExternalAPI?: any }).JitsiMeetExternalAPI;
      if (!JitsiAPI) {
        setMeetingStatus('Camera room unavailable. Showing local preview only.');
        setMeetingReady(false);
        void startLocalMedia();
        return;
      }

      cleanup();
      setMeetingStatus('Connecting camera room...');

      const api = new JitsiAPI('meet.jit.si', {
        roomName,
        parentNode: meetingContainerRef.current,
        userInfo: {
          displayName: user?.name || 'Guest',
          email: user?.email || '',
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithVideoMuted: false,
          startWithAudioMuted: false,
          enableWelcomePage: false,
          hidePrejoinPage: true,
          enableNoisyMicDetection: true,
          enableLobbyChat: true,
          enableClosePage: false,
          disableRemoveRaisedHandOnFocus: false,
          enableInsecureRoomNameWarning: false,
          enableIceRestart: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'reactions', 'participants-pane', 'tileview', 'fullscreen', 'hangup'],
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_VIDEO_BACKGROUND: false,
          DISPLAY_WELCOME_PAGE_ON_DEPART: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        },
      });

      jitsiApiRef.current = api;
      setMeetingReady(true);
      setIsTileView(true);

      api.addListener('videoConferenceJoined', () => {
        setMeetingStatus('Camera room connected');
        try {
          api.executeCommand('toggleTileView');
        } catch {}
      });
      api.addListener('videoConferenceLeft', () => {
        setMeetingStatus('Left camera room');
      });
      api.addListener('audioMuteStatusChanged', (event: { muted?: boolean }) => {
        setIsMuted(Boolean(event?.muted));
      });
      api.addListener('videoMuteStatusChanged', (event: { muted?: boolean }) => {
        setIsVideoOn(!Boolean(event?.muted));
      });
      api.addListener('readyToClose', () => {
        setMeetingStatus('Camera room closed');
      });

      setMeetingStatus('Camera room ready');
    };

    const scriptId = 'jitsi-external-api-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if ((window as Window & { JitsiMeetExternalAPI?: unknown }).JitsiMeetExternalAPI) {
      initMeeting();
      return () => {
        cancelled = true;
        cleanup();
      };
    }

    if (existingScript) {
      existingScript.addEventListener('load', initMeeting, { once: true });
      existingScript.addEventListener('error', () => {
        if (!cancelled) {
          setMeetingStatus('Camera room failed to load. Showing local preview only.');
          setMeetingReady(false);
          void startLocalMedia();
        }
      }, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initMeeting;
      script.onerror = () => {
        if (!cancelled) {
          setMeetingStatus('Camera room failed to load. Showing local preview only.');
          setMeetingReady(false);
          void startLocalMedia();
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [classId, user?.email, user?.name]);

  const runMeetingCommand = (command: string) => {
    const api = jitsiApiRef.current;
    if (!api?.executeCommand) return false;
    api.executeCommand(command);
    return true;
  };

  const toggleTileView = () => {
    if (runMeetingCommand('toggleTileView')) {
      setIsTileView((value) => !value);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingJoinUrl);
      setMeetingStatus('Invite link copied');
    } catch {
      setMeetingStatus('Copy failed. Use the URL from the browser.');
    }
  };

  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsMuted(false);
      setIsVideoOn(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to access camera/microphone');
    }
  };

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setIsVideoOn(false);
  };

  const toggleMute = () => {
    if (runMeetingCommand('toggleAudio')) {
      return;
    }

    const s = localStreamRef.current;
    if (!s) return;
    const audioTracks = s.getAudioTracks();
    if (audioTracks.length === 0) return;
    audioTracks.forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((v) => !v);
  };

  const toggleVideo = async () => {
    if (runMeetingCommand('toggleVideo')) {
      return;
    }

    const s = localStreamRef.current;
    if (!s) {
      await startLocalMedia();
      return;
    }

    const videoTracks = s.getVideoTracks();
    if (videoTracks.length === 0) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // attach new video track(s) to local stream ref for preview purposes
        newStream.getVideoTracks().forEach((t) => s.addTrack(t));
        setIsVideoOn(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to start video');
      }
      return;
    }

    videoTracks.forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOn((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (runMeetingCommand('toggleShareScreen')) {
      setIsScreenSharing((value) => !value);
      return;
    }

    if (!isScreenSharing) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        screenStreamRef.current = s as MediaStream;
        setScreenStream(s as MediaStream);
        setIsScreenSharing(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = s as MediaStream;
        const track = s.getVideoTracks()[0];
        if (track) {
          track.addEventListener('ended', () => {
            setIsScreenSharing(false);
            if (localStreamRef.current && localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            if (screenStreamRef.current) {
              try {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
              } catch {}
              screenStreamRef.current = null;
              setScreenStream(null);
            }
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to share screen');
      }
    } else {
      if (screenStreamRef.current) {
        try {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        screenStreamRef.current = null;
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      if (localStreamRef.current && localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
  };
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
        let resolvedCourse: ApiCourse | null = null;
        let resolvedSession: ApiClassSession | null = null;

        try {
          resolvedSession = normalizeSession((await api.session(classId)).data);
          const sessionCourseRes = await api.course(resolvedSession.courseId);
          resolvedCourse = normalizeCourse(sessionCourseRes.data);
        } catch {
          const courseRes = await api.course(classId);
          resolvedCourse = normalizeCourse(courseRes.data);

          const sessionsRes = await api.courseSessions(resolvedCourse.id);
          const nextSessions = (Array.isArray(sessionsRes.data) ? sessionsRes.data : []).map(normalizeSession);
          resolvedSession = nextSessions.find((item) => item.status === 'live') ?? nextSessions[0] ?? null;

          if (!resolvedSession && user && (user.role === 'teacher' || user.role === 'admin')) {
            const now = new Date();
            const created = await api.createCourseSession(resolvedCourse.id, {
              title: `${resolvedCourse.code} Live Class`,
              starts_at: now.toISOString(),
              ends_at: new Date(now.getTime() + 60 * 60000).toISOString(),
              meeting_url: `/classroom/${resolvedCourse.id}`,
              status: 'live',
              notes: `Auto-created live session for ${resolvedCourse.code}.`,
            });
            const finalMeetingUrl = `/classroom/${created.data.id}`;
            const updated = await api.updateCourseSession(resolvedCourse.id, created.data.id, { meeting_url: finalMeetingUrl });
            resolvedSession = normalizeSession(updated.data);
          }
        }

        if (cancelled) return;
        setCourse(resolvedCourse);
        setSession(resolvedSession);
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
        const res = await api.getClassroomMessages(session!.id);
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
        const res = await api.getClassroomParticipants(session!.id);
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

    if (jitsiApiRef.current?.executeCommand) {
      try {
        jitsiApiRef.current.executeCommand('hangup');
      } catch {}
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
    <div className="flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="border-b border-border bg-background/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
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
            <div className="rounded-lg bg-muted px-3 py-1.5 text-sm">{participants.length} Participants</div>
            <div className={`rounded-lg px-3 py-1.5 text-sm ${session?.status === 'live' ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'}`}>
              {session?.status === 'live' ? 'Live' : safeText(session?.status, 'Session')}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">
            <Card className="min-h-0 overflow-hidden border-border bg-[#0f1115] text-white shadow-2xl">
              <CardContent className="flex h-full min-h-0 flex-col p-0">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-white/5 backdrop-blur">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">Live</span>
                      <span className="text-xs text-white/60 truncate">{courseLabel}</span>
                    </div>
                    <div className="mt-1 text-sm text-white/80 truncate">{meetingStatus}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <button type="button" onClick={() => void copyInviteLink()} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">
                      <Copy className="h-4 w-4" />
                      Invite
                    </button>
                    <button type="button" onClick={() => setShowSidebar((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">
                      <MessageSquare className="h-4 w-4" />
                      {showSidebar ? 'Hide chat' : 'Show chat'}
                    </button>
                    <button type="button" onClick={() => toggleTileView()} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10">
                      <LayoutGrid className="h-4 w-4" />
                      {isTileView ? 'Speaker view' : 'Tile view'}
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 p-3 lg:p-4">
                  <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="relative min-h-[min(72vh,700px)] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                      <div ref={meetingContainerRef} className="absolute inset-0 h-full w-full" />

                      {!meetingReady ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/70 p-6">
                          <div className="text-2xl font-semibold">{course ? course.title : 'Classroom'}</div>
                          <div className="text-sm mt-2">{meetingStatus}</div>
                          <div className="mt-4 h-48 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/80">
                            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                          </div>
                        </div>
                      ) : null}

                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white shadow backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {participants.length} in room
                        <span className="text-white/40">•</span>
                        {isScreenSharing ? 'Sharing screen' : 'Camera on'}
                      </div>

                      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#171a21]/95 px-3 py-2 shadow-2xl backdrop-blur-md">
                        <button type="button" onClick={() => void toggleMute()} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'} title={isMuted ? 'Unmute microphone' : 'Mute microphone'} className={`grid h-12 w-12 place-items-center rounded-full transition ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        <button type="button" onClick={() => void toggleVideo()} aria-label={isVideoOn ? 'Turn camera off' : 'Turn camera on'} title={isVideoOn ? 'Turn camera off' : 'Turn camera on'} className={`grid h-12 w-12 place-items-center rounded-full transition ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white'}`}>
                          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </button>
                        <button type="button" onClick={() => void toggleScreenShare()} aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'} title={isScreenSharing ? 'Stop screen share' : 'Share screen'} className={`grid h-12 w-12 place-items-center rounded-full transition ${isScreenSharing ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                          <Monitor className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => setIsHandRaised((value) => !value)} aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'} title={isHandRaised ? 'Lower hand' : 'Raise hand'} className={`grid h-12 w-12 place-items-center rounded-full transition ${isHandRaised ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                          <Hand className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => setShowSidebar((value) => !value)} aria-label={showSidebar ? 'Hide chat and participants panel' : 'Show chat and participants panel'} title={showSidebar ? 'Hide chat and participants panel' : 'Show chat and participants panel'} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden">
                          <MessageSquare className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => void handleEndClass()} disabled={endingClass} className="ml-2 inline-flex h-12 items-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-70">
                          <Phone className="h-4 w-4" />
                          {endingClass ? 'Ending...' : 'End'}
                        </button>
                      </div>
                    </div>

                    {showSidebar ? (
                      <Card className="min-h-0 overflow-hidden border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
                        <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'chat' | 'participants')} className="flex h-full min-h-0 flex-col">
                          <CardHeader className="pb-0">
                            <div className="flex items-center justify-between gap-3">
                              <CardTitle className="text-lg text-white">People & Chat</CardTitle>
                              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)} className="text-white hover:bg-white/10 hover:text-white">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <TabsList className="mt-3 grid grid-cols-2 bg-white/10 text-white">
                              <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                              </TabsTrigger>
                              <TabsTrigger value="participants" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                                <Users className="w-4 h-4 mr-2" />
                                People
                              </TabsTrigger>
                            </TabsList>
                          </CardHeader>
                          <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
                            <TabsContent value="chat" className="m-0 flex h-full flex-col">
                              <ScrollArea className="flex-1 px-4 pt-4">
                                <div className="space-y-4 pb-4">
                                  {messages.map((msg) => (
                                    <div key={msg.id} className="space-y-1 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <span className={`text-sm font-semibold ${msg.userId === user?.id ? 'text-cyan-300' : 'text-white'}`}>{msg.userName}</span>
                                        <span className="text-[11px] text-white/40">{safeDateTimeText(msg.createdAt)}</span>
                                      </div>
                                      <div className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{msg.body}</div>
                                    </div>
                                  ))}
                                  {messages.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/50">
                                      No messages yet. Say hello.
                                    </div>
                                  ) : null}
                                </div>
                              </ScrollArea>
                              <div className="border-t border-white/10 p-4">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type a message..."
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && void handleSendMessage()}
                                    className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
                                  />
                                  <Button size="icon" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => void handleSendMessage()}>
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="participants" className="m-0 flex h-full flex-col">
                              <ScrollArea className="flex-1 px-4 pt-4">
                                <div className="space-y-2 pb-4">
                                  {participants.map((participant) => {
                                    const initials = participant.name.split(' ').map((part) => part[0]).join('') || 'P';
                                    return (
                                      <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-cyan-500 text-white text-sm">{initials}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="text-sm font-medium text-white">{participant.name}</div>
                                            <div className="text-xs text-white/50">{participant.role === 'teacher' ? 'Host' : 'Student'}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {participant.isMuted ? <MicOff className="w-4 h-4 text-white/40" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                                          {participant.isHandRaised ? <Hand className="w-4 h-4 text-amber-400" /> : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </TabsContent>
                          </CardContent>
                        </Tabs>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
