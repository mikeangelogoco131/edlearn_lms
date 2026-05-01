import { Link } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Video,
  BookOpen,
  FileText,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Play,
  Plus,
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { api, ApiAssignment, ApiClassSession, ApiCourse } from '../lib/api';
import { EventsCalendar } from '../components/EventsCalendar';
import { CourseAnnouncements } from '../components/CourseAnnouncements';
import { useAuth } from '../contexts/AuthContext';
import { format, isAfter, parseISO } from 'date-fns';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentCourses, setStudentCourses] = useState<ApiCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<ApiCourse[]>([]);
  const [sessions, setSessions] = useState<ApiClassSession[]>([]);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [coursesView, setCoursesView] = useState<'enrolled' | 'completed'>('enrolled');
  const [studentAnalytics, setStudentAnalytics] = useState({
    avgGrade: 0,
    attendanceRate: 0,
    pendingTasks: 0,
    progress: 0,
    totalCourses: 0,
    upcomingSessions: 0,
  });
  const [joiningCourseId, setJoiningCourseId] = useState<string | null>(null);
  const coursesScrollerRef = useRef<HTMLDivElement | null>(null);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('student_upcoming_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) return;
      try {
        const coursesRes = await api.courses();
        if (cancelled) return;
        setStudentCourses(coursesRes.data);

        // Avoid exploding the number of requests when a student has many subjects.
        // Load timeline widgets using only the first (most relevant) courses.
        const widgetCourses = coursesRes.data.slice(0, 12);

        const sessionsSettled = await Promise.allSettled(
          widgetCourses.map((c) => api.courseSessions(c.id).then((r) => r.data))
        );
        if (!cancelled) {
          const nextSessions = sessionsSettled
            .filter((r): r is PromiseFulfilledResult<ApiClassSession[]> => r.status === 'fulfilled')
            .flatMap((r) => r.value);
          setSessions(nextSessions);
        }

        const assignmentsSettled = await Promise.allSettled(
          widgetCourses.map((c) => api.courseAssignments(c.id).then((r) => r.data))
        );
        if (!cancelled) {
          const nextAssignments = assignmentsSettled
            .filter((r): r is PromiseFulfilledResult<ApiAssignment[]> => r.status === 'fulfilled')
            .flatMap((r) => r.value);
          setAssignments(nextAssignments);
        }

        const analyticsRes = await api.analyticsStudent();
        if (!cancelled) {
          setStudentAnalytics(analyticsRes.data);
        }

        const catalogRes = await api.courses({ available: true });
        if (!cancelled) {
          setAvailableCourses(catalogRes.data);
        }
      } catch {
        // Keep UI stable if API is unavailable
        toast.error('Failed to refresh your subjects.');
      }
    }

    load();

    function handleFocus() {
      if (cancelled) return;
      void load();
    }

    function handleVisibilityChange() {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        void load();
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const studentAssignments = useMemo(() => assignments.slice(0, 4), [assignments]);
  const assessmentsDueCount = useMemo(() => {
    return assignments.filter((a) => !!a.dueDate).filter((a) => a.status !== 'graded').length;
  }, [assignments]);

  const assessmentsDueByCourse = useMemo(() => {
    const courseById = new Map(studentCourses.map((c) => [c.id, c] as const));
    const counts: Record<string, number> = {};
    for (const a of assignments) {
      if (!a.dueDate) continue;
      if (a.status === 'graded') continue;
      counts[a.courseId] = (counts[a.courseId] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([courseId, count]) => {
        const course = courseById.get(courseId);
        const label = course ? `${course.code} - ${course.title}` : `Course ${courseId}`;
        return { courseId, count, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [assignments, studentCourses]);
  const upcomingClasses = useMemo(
    () => sessions.filter((s) => s.status === 'scheduled'),
    [sessions]
  );

  useEffect(() => {
    try {
      localStorage.setItem('student_upcoming_collapsed', upcomingCollapsed ? '1' : '0');
    } catch {
      // ignore storage failures
    }
  }, [upcomingCollapsed]);

  const enrolledCourses = useMemo(
    () => studentCourses.filter((c) => (c.status || '').toLowerCase() !== 'completed'),
    [studentCourses]
  );
  const completedCoursesList = useMemo(
    () => studentCourses.filter((c) => (c.status || '').toLowerCase() === 'completed'),
    [studentCourses]
  );

  const visibleCourses = coursesView === 'completed' ? completedCoursesList : enrolledCourses;

  const courseImages = [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
  ] as const;

  function scrollCourses(direction: 'left' | 'right') {
    const el = coursesScrollerRef.current;
    if (!el) return;
    const delta = Math.max(280, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: direction === 'left' ? -delta : delta, behavior: 'smooth' });
  }

  const completionRate = Math.round(studentAnalytics.progress);
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === 'graded' || a.status === 'submitted').length;

  return (
    <DashboardLayout title="Student Dashboard" layout="full" showTitle={false}>
      <Tabs defaultValue="courses" className="space-y-0">
        <div className="flex flex-col w-full min-h-screen">
          
          {/* Top Hero & Nav Area */}
          <div
            className="text-white pb-6 pt-12 px-6 shadow-lg relative border-b border-white/10 overflow-hidden bg-[linear-gradient(135deg,_#059669_0%,_#0d9488_40%,_#047857_100%)]"
          >
            {/* Decorative orb */}
            <div
              className="pointer-events-none absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-20 bg-[radial-gradient(circle,_rgba(255,255,255,0.4)_0%,_transparent_70%)]"
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-10 bg-[radial-gradient(circle,_rgba(20,184,166,0.8)_0%,_transparent_70%)]"
            />

            <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    Student Portal
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
                  <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
                    You have <span className="font-semibold text-white">{upcomingClasses.length}</span> classes scheduled. Let's make it a great day of learning!
                  </p>
                </div>
                <div className="hidden md:block bg-white/15 backdrop-blur border border-white/25 p-4 rounded-2xl text-right">
                  <div className="text-2xl font-bold tracking-tight">{format(new Date(), 'EEEE')}</div>
                  <div className="text-emerald-100 text-sm">{format(new Date(), 'MMMM d, yyyy')}</div>
                </div>
              </div>

              {/* Top Navigation replacing Sidebar */}
              <TabsList className="bg-white/15 border border-white/25 p-1.5 inline-flex w-full md:w-fit backdrop-blur-md rounded-xl text-white shadow-sm overflow-x-auto justify-start hide-scrollbar">
                <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <BookOpen className="w-4 h-4 mr-2" /> My Courses
                </TabsTrigger>
                <TabsTrigger value="catalog" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Course Catalog
                </TabsTrigger>
                <TabsTrigger value="assignments" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <FileText className="w-4 h-4 mr-2" /> Assignments
                </TabsTrigger>
                <TabsTrigger value="grades" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <Award className="w-4 h-4 mr-2" /> Grades
                </TabsTrigger>
                <TabsTrigger value="materials" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <FileText className="w-4 h-4 mr-2" /> Materials
                </TabsTrigger>
                <TabsTrigger value="announcements" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" /> Announcements
                </TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm rounded-lg px-4 py-2 whitespace-nowrap transition-all font-medium text-sm">
                  <Clock className="w-4 h-4 mr-2" /> Calendar
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 min-w-0 max-w-7xl mx-auto w-full">
            <div className="px-6 py-8">

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Enrolled Courses', value: studentAnalytics.totalCourses, icon: <BookOpen className="w-6 h-6" />, iconClass: 'stat-icon-indigo' },
                { label: 'Attendance Rate', value: `${studentAnalytics.attendanceRate}%`, icon: <CheckCircle className="w-6 h-6" />, iconClass: 'stat-icon-emerald' },
                { label: 'Current Avg', value: `${studentAnalytics.avgGrade}%`, icon: <Award className="w-6 h-6" />, iconClass: 'stat-icon-violet' },
                { label: 'Pending Tasks', value: studentAnalytics.pendingTasks, icon: <FileText className="w-6 h-6" />, iconClass: 'stat-icon-amber' },
              ].map((stat) => (
                <Card key={stat.label} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconClass}`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Upcoming Classes */}
              <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <div className="w-full flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Upcoming Classes</CardTitle>
                  <CardDescription>Your scheduled virtual classroom sessions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground mr-2">{upcomingClasses.length} scheduled</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-pressed={upcomingCollapsed}
                    aria-label={upcomingCollapsed ? 'Expand upcoming classes' : 'Minimize upcoming classes'}
                    onClick={() => setUpcomingCollapsed((v) => !v)}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${upcomingCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {upcomingCollapsed ? (
              <CardContent>
                <div className="flex items-center justify-between p-4">
                  <div className="text-sm text-gray-600">{upcomingClasses.length} upcoming class{upcomingClasses.length !== 1 ? 'es' : ''}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setUpcomingCollapsed(false)}>Expand</Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="space-y-4">
                  {upcomingClasses.map((session) => {
                    const course = studentCourses.find(c => c.id === session.courseId);
                    const sessionDate = session.date ? new Date(session.date) : null;
                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 glass-item">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                            <div className="text-xs">{sessionDate ? format(sessionDate, 'MMM') : '—'}</div>
                            <div className="text-xl font-bold">{sessionDate ? format(sessionDate, 'd') : '—'}</div>
                          </div>
                          <div>
                            <div className="font-semibold">{session.title}</div>
                            <div className="text-sm text-gray-600">{course?.code} - {course?.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {session.time} • {session.duration}
                            </div>
                          </div>
                        </div>
                        <Link to={`/classroom/${session.courseId}`}>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Video className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Assignment Completion</span>
                  <span className="text-sm text-gray-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {completedAssignments} of {totalAssignments} completed
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Course Progress</span>
                </div>
                <Progress value={studentAnalytics.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">On track with learning goals</p>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-3">Recent Grades</div>
                <div className="space-y-2">
                  {studentAnalytics.recentGrades && studentAnalytics.recentGrades.length > 0 ? (
                    studentAnalytics.recentGrades.map((rg, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-600 font-medium">{rg.assignment}</span>
                          <span className="text-[10px] text-gray-500 uppercase">{rg.course}</span>
                        </div>
                        <span className="font-semibold text-emerald-600">{rg.grade}/{rg.points}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No recent grades available.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessmentsDueCount <= 0 ? (
                  <div className="text-sm text-gray-600">No assessments due</div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 hover:bg-transparent flex items-center justify-start gap-3"
                        aria-label="View assessments by subject"
                      >
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-blue-600">{assessmentsDueCount} assessments due</div>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                      {assessmentsDueByCourse.map((row) => (
                        <DropdownMenuItem key={row.courseId} asChild>
                          <Link to={`/course/${row.courseId}`} className="w-full flex items-center justify-between gap-3">
                            <span className="truncate">{row.label}</span>
                            <span className="text-xs text-gray-600">{row.count}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
            </div>

            <div className="space-y-6">
              <TabsContent value="courses" className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant={coursesView === 'enrolled' ? 'default' : 'outline'}
                      onClick={() => setCoursesView('enrolled')}
                      className={coursesView === 'enrolled' ? 'bg-blue-600 hover:bg-blue-700' : undefined}
                    >
                      Enrolled
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-semibold">
                        {enrolledCourses.length}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={coursesView === 'completed' ? 'default' : 'outline'}
                      onClick={() => setCoursesView('completed')}
                      className={coursesView === 'completed' ? 'bg-blue-600 hover:bg-blue-700' : undefined}
                    >
                      Completed
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-semibold">
                        {completedCoursesList.length}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => scrollCourses('left')}
                      aria-label="Scroll courses left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => scrollCourses('right')}
                      aria-label="Scroll courses right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div
                  ref={coursesScrollerRef}
                  className="flex gap-6 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
                >
                  {visibleCourses.map((course, index) => {
                    const courseSessions = sessions.filter((s) => s.courseId === course.id);
                    const completed = courseSessions.filter((s) => (s.status || '').toLowerCase() === 'completed').length;
                    const total = courseSessions.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const actionLabel = pct > 0 ? 'Resume' : 'Start';

                    return (
                      <Card
                        key={course.id}
                        className="glass-card w-[280px] sm:w-[320px] flex-shrink-0 overflow-hidden snap-start"
                      >
                        <Link
                          to={`/course/${course.id}`}
                          className="block"
                          aria-label={`View ${course.code} ${course.title}`}
                        >
                          <div className="w-full aspect-[16/10] overflow-hidden">
                            <ImageWithFallback
                              src={courseImages[index % courseImages.length]}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>

                        <CardContent className="p-5 space-y-4">
                          <Link
                            to={`/course/${course.id}`}
                            className="block space-y-1"
                            aria-label={`View ${course.code} ${course.title}`}
                          >
                            <div className="text-sm text-muted-foreground">{course.code}</div>
                            <div className="text-lg font-semibold leading-snug line-clamp-2">{course.title}</div>
                          </Link>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="text-sm font-semibold whitespace-nowrap">{pct}%</div>
                              <Progress value={pct} className="h-2 flex-1" />
                            </div>
                            <Link to={`/course/${course.id}`}>
                              <Button variant="outline" className="rounded-full">
                                {actionLabel}
                                <Play className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                                {(course.teacher || 'T').trim().slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{course.materials}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>{course.assignments}</span>
                              </div>
                            </div>
                            <div className="whitespace-nowrap">{total} lessons</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {visibleCourses.length === 0 && (
                    <Card className="glass-card w-full">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        No {coursesView === 'completed' ? 'completed' : 'enrolled'} subjects.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="catalog" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map((course, index) => (
                    <Card key={course.id} className="glass-card overflow-hidden">
                      <div className="w-full aspect-video overflow-hidden">
                        <ImageWithFallback
                          src={courseImages[index % courseImages.length]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{course.code}</div>
                          <h3 className="text-lg font-bold line-clamp-1">{course.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{course.description || 'No description available.'}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Instructor: <span className="font-medium text-foreground">{course.teacher}</span>
                          </div>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]" 
                            size="sm"
                            disabled={joiningCourseId === course.id}
                            onClick={async () => {
                              setJoiningCourseId(course.id);
                              try {
                                await api.selfEnroll(course.id);
                                toast.success(`Enrolled in ${course.code}!`);
                                // Refresh
                                const coursesRes = await api.courses();
                                setStudentCourses(coursesRes.data);
                                setAvailableCourses(prev => prev.filter(c => c.id !== course.id));
                              } catch (err: any) {
                                toast.error(err.message || 'Enrollment failed');
                              } finally {
                                setJoiningCourseId(null);
                              }
                            }}
                          >
                            {joiningCourseId === course.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Joining
                              </>
                            ) : (
                              'Join Course'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {availableCourses.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground italic">
                      No new courses available at the moment.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <EventsCalendar canManage={false} />
              </TabsContent>

              <TabsContent value="announcements" className="space-y-6">
                <CourseAnnouncements courses={studentCourses} canPost={false} />
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Assignments & Tasks</CardTitle>
                    <CardDescription>View and submit your assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentAssignments.map((assignment) => {
                        const course = studentCourses.find((c) => c.id === assignment.courseId);
                        if (!assignment.dueDate) return null;
                        const dueDate = parseISO(assignment.dueDate);
                        const isOverdue = isAfter(new Date(), dueDate);
                        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <div key={assignment.id} className="p-4 glass-item">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{assignment.title}</span>
                                  {isOverdue ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                                      <AlertCircle className="w-3 h-3" />
                                      Overdue
                                    </span>
                                  ) : daysUntilDue <= 2 ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                                      <Clock className="w-3 h-3" />
                                      Due soon
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {course?.code} - {course?.title}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{assignment.description}</div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-sm font-medium text-blue-600">{assignment.points} pts</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="text-sm text-gray-600">Due: {format(dueDate, 'MMM d, h:mm a')}</div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Submit Work
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Grade Report</CardTitle>
                    <CardDescription>Your academic performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {studentCourses.map((course) => (
                        <div key={course.id} className="p-4 glass-item">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{course.code}</div>
                              <div className="text-sm text-gray-600">{course.title}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {course.id ? (
                                  <span className="text-xl">
                                    {/* For a real dashboard, we'd fetch this in a loop or have a bulk API. 
                                        Since we have analytics, we'll display the calculated course progress here as a proxy for grades if specific grade fetching isn't bulked. */}
                                    View Details
                                  </span>
                                ) : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Link to={`/course/${course.id}?tab=grades`}>
                              <Button variant="link" size="sm" className="text-blue-600 h-auto p-0">
                                View Gradebook
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Course Materials</CardTitle>
                    <CardDescription>Access lecture notes, videos, and resources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentCourses.map((course) => (
                        <div key={course.id} className="p-4 glass-item">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{course.code} - {course.title}</div>
                              <div className="text-sm text-gray-600">{course.materials} items available</div>
                            </div>
                            <Link to={`/course/${course.id}?tab=materials`}>
                              <Button variant="outline" size="sm">
                                Open Materials
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </div>
        </div>
      </Tabs>
    </DashboardLayout>
  );
}
