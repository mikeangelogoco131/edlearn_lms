import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpen, LogOut, User, Bell, Search, Moon, Sun, MessageSquare, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api, ApiMessage, ApiNotification } from '../lib/api';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [messagesMetaLoading, setMessagesMetaLoading] = useState(false);
  const [latestInboxIso, setLatestInboxIso] = useState<string | null>(null);

  const [messagesFolder, setMessagesFolder] = useState<'inbox' | 'sent' | 'drafts' | 'deleted'>('inbox');
  const [messagesPreviewLoading, setMessagesPreviewLoading] = useState(false);
  const [messagesPreview, setMessagesPreview] = useState<ApiMessage[]>([]);

  const notificationsStorageKey = useMemo(
    () => (user?.id ? `edlearn_notifications_last_seen_v2_${user.id}` : 'edlearn_notifications_last_seen_v2'),
    [user?.id]
  );

  const messagesStorageKey = useMemo(
    () => (user?.id ? `edlearn_messages_last_seen_v1_${user.id}` : 'edlearn_messages_last_seen_v1'),
    [user?.id]
  );

  const [lastSeenNotificationsIso, setLastSeenNotificationsIso] = useState<string | null>(() => {
    try {
      return localStorage.getItem(notificationsStorageKey);
    } catch {
      return null;
    }
  });

  const [lastSeenMessagesIso, setLastSeenMessagesIso] = useState<string | null>(() => {
    try {
      return localStorage.getItem(messagesStorageKey);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      setLastSeenNotificationsIso(localStorage.getItem(notificationsStorageKey));
    } catch {
      setLastSeenNotificationsIso(null);
    }
  }, [notificationsStorageKey]);

  useEffect(() => {
    try {
      setLastSeenMessagesIso(localStorage.getItem(messagesStorageKey));
    } catch {
      setLastSeenMessagesIso(null);
    }
  }, [messagesStorageKey]);

  const latestNotificationsIso = useMemo(() => {
    const iso = notifications
      .map((n) => n.publishedAt)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1);
    return iso ?? null;
  }, [notifications]);

  const hasUnreadNotifications = useMemo(() => {
    if (!latestNotificationsIso) return false;
    if (!lastSeenNotificationsIso) return true;
    return latestNotificationsIso > lastSeenNotificationsIso;
  }, [latestNotificationsIso, lastSeenNotificationsIso]);

  const hasUnreadMessages = useMemo(() => {
    if (!latestInboxIso) return false;
    if (!lastSeenMessagesIso) return true;
    return latestInboxIso > lastSeenMessagesIso;
  }, [latestInboxIso, lastSeenMessagesIso]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      if (!user || user.role !== 'admin') return;
      setNotificationsLoading(true);
      try {
        const res = await api.notifications();
        if (cancelled) return;
        setNotifications(res.data);
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    if (notificationsOpen) loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [notificationsOpen, user]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    async function refreshInboxMeta() {
      try {
        const inboxRes = await api.messages({ folder: 'inbox', limit: 1 });
        if (cancelled) return;
        const m = inboxRes.data[0];
        const iso = m?.sentAt || m?.createdAt || null;
        setLatestInboxIso(iso);
      } catch {
        if (!cancelled) setLatestInboxIso(null);
      }
    }

    refreshInboxMeta();

    const onFocus = () => refreshInboxMeta();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(refreshInboxMeta, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessagesPanel() {
      if (!user) return;
      setMessagesMetaLoading(true);
      setMessagesPreviewLoading(true);
      try {
        const [inboxRes, folderRes] = await Promise.all([
          api.messages({ folder: 'inbox', limit: 1 }),
          api.messages({ folder: messagesFolder, limit: 5 }),
        ]);
        if (cancelled) return;
        const m = inboxRes.data[0];
        const iso = m?.sentAt || m?.createdAt || null;
        setLatestInboxIso(iso);
        setMessagesPreview(folderRes.data || []);
      } catch {
        if (!cancelled) {
          setLatestInboxIso(null);
          setMessagesPreview([]);
        }
      } finally {
        if (!cancelled) {
          setMessagesMetaLoading(false);
          setMessagesPreviewLoading(false);
        }
      }
    }

    if (messagesOpen) loadMessagesPanel();

    return () => {
      cancelled = true;
    };
  }, [messagesOpen, messagesFolder, user]);

  useEffect(() => {
    if (!notificationsOpen) return;
    if (!latestNotificationsIso) return;
    try {
      localStorage.setItem(notificationsStorageKey, latestNotificationsIso);
      setLastSeenNotificationsIso(latestNotificationsIso);
    } catch {
      // ignore
    }
  }, [latestNotificationsIso, notificationsOpen, notificationsStorageKey]);

  useEffect(() => {
    if (!messagesOpen) return;
    if (!latestInboxIso) return;
    try {
      localStorage.setItem(messagesStorageKey, latestInboxIso);
      setLastSeenMessagesIso(latestInboxIso);
    } catch {
      // ignore
    }
  }, [latestInboxIso, messagesOpen, messagesStorageKey]);

  const handleProfileSettings = () => {
    if (user?.role === 'admin') navigate('/admin/profile');
    else navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'teacher':
        return 'bg-blue-100 text-blue-700';
      case 'student':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getNotificationTargetTab = (type: ApiNotification['type']): string | null => {
    switch (type) {
      case 'announcement':
      case 'announcement_expiring':
        return 'announcements';
      case 'teacher_message':
        return 'messages';
      case 'user_added':
        return 'users';
      case 'class_session_added':
        return 'courses';
      case 'course_added':
        return 'courseManagement';
      case 'event_added':
      case 'event_ending':
        return 'calendar';
      default:
        return null;
    }
  };

  const getNotificationSubtitle = (n: ApiNotification): string => {
    switch (n.type) {
      case 'announcement':
        return `${n.course ? `${n.course.code} • ${n.course.title}` : 'Announcement'}${n.author ? ` • ${n.author.name}` : ''}`;
      case 'teacher_message':
        return `${n.author ? `Teacher message • ${n.author.name}` : 'Teacher message'}`;
      case 'announcement_expiring':
        return `${n.course ? `${n.course.code} • ${n.course.title}` : 'Announcement'} • Expiring soon`;
      case 'user_added':
        return n.user ? `User added • ${n.user.role}` : 'User added';
      case 'course_added':
        return n.course ? `Course added • ${n.course.code}` : 'Course added';
      case 'class_session_added':
        return n.course ? `Class session added • ${n.course.code}` : 'Class session added';
      case 'event_added':
        return 'Calendar event added';
      case 'event_ending':
        return 'Calendar event ending soon';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold">EdLearn</span>
              </Link>

              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses, students..."
                  className="w-96 pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {user ? (
                <DropdownMenu open={messagesOpen} onOpenChange={setMessagesOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" aria-label="Messages">
                      <MessageSquare className="w-5 h-5" />
                      {hasUnreadMessages ? (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-96 p-0">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Messages</div>
                          <div className="text-xs text-muted-foreground capitalize">{messagesFolder}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Message folders">
                                <Menu className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Folders</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setMessagesFolder('inbox');
                                }}
                              >
                                Inbox
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setMessagesFolder('sent');
                                }}
                              >
                                Sent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setMessagesFolder('drafts');
                                }}
                              >
                                Drafts
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setMessagesFolder('deleted');
                                }}
                              >
                                Deleted
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

            						  {user.role === 'admin' ? (
            							<Button
            								size="sm"
            								onClick={() => {
            									setMessagesOpen(false);
            									navigate('/admin?tab=messages&compose=1');
            								}}
            							>
            								Compose Mail
            							</Button>
            						  ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMessagesOpen(false);
                                        if (user.role === 'admin') {
                                          navigate(`/admin?tab=messages&folder=${messagesFolder}`);
                                        } else {
                                          navigate(`/messages?folder=${messagesFolder}`);
                                        }
                          }}
                        >
                          See All Messages
                        </Button>
                      </div>
                    </div>

                    <div className="p-2">
                      {messagesPreviewLoading || messagesMetaLoading ? (
                        <div className="px-2 py-6 text-sm text-muted-foreground">Loading…</div>
                      ) : messagesPreview.length === 0 ? (
                        <div className="px-2 py-6 text-sm text-muted-foreground">No messages.</div>
                      ) : (
                        <div className="space-y-1">
                          {messagesPreview.map((m) => {
                            const title = m.subject?.trim() ? m.subject.trim() : '(No subject)';
                            const iso = m.sentAt || m.createdAt;
                            const when = iso ? new Date(iso).toLocaleString() : '—';
                            const subtitle =
                              messagesFolder === 'sent'
                                ? `To: ${m.recipient?.name || '—'}`
                                : messagesFolder === 'inbox'
                                  ? `From: ${m.sender?.name || '—'}`
                                  : `From: ${m.sender?.name || '—'} • To: ${m.recipient?.name || '—'}`;
                            const isUnread = messagesFolder === 'inbox' && m.status === 'sent' && !m.readAt;

                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setMessagesOpen(false);
                                  if (user.role === 'admin') {
                                    navigate(`/admin?tab=messages&folder=${messagesFolder}`);
                                  } else {
                                    navigate(`/messages?folder=${messagesFolder}`);
                                  }
                                }}
                                className="w-full text-left rounded-md px-2 py-2 hover:bg-accent"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium line-clamp-1">
                                      {title}{isUnread ? ' • Unread' : ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{subtitle}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">{when}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {hasUnreadNotifications ? (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {user?.role !== 'admin' ? (
                    <DropdownMenuItem disabled>No notifications available.</DropdownMenuItem>
                  ) : notificationsLoading ? (
                    <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                  ) : notifications.length === 0 ? (
                    <DropdownMenuItem disabled>No notifications.</DropdownMenuItem>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start gap-1"
                        onSelect={(e) => {
                          e.preventDefault();
                          const tab = getNotificationTargetTab(n.type);
                          if (tab === 'messages') navigate('/admin?tab=messages&folder=inbox');
                          else if (tab) navigate(`/admin?tab=${tab}`);
                        }}
                      >
                        <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{getNotificationSubtitle(n)}</div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-block w-fit mt-1 capitalize ${getRoleBadgeColor(user?.role || '')}`}>
                        {user?.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleProfileSettings();
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>

        {children}
      </main>
    </div>
  );
}
