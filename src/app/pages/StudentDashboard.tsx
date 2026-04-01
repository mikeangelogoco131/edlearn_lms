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
  const [sessions, setSessions] = useState<ApiClassSession[]>([]);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [coursesView, setCoursesView] = useState<'enrolled' | 'completed'>('enrolled');
  const coursesScrollerRef = useRef<HTMLDivElement | null>(null);

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

  const completedAssignments = 12;
  const totalAssignments = 15;
  const completionRate = Math.round((completedAssignments / totalAssignments) * 100);

  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hidden'>('expanded');
  const sidebarCollapsed = sidebarMode === 'collapsed';
  const sidebarHidden = sidebarMode === 'hidden';

  return (
    <DashboardLayout title="Student Dashboard" layout="full" showTitle={false}>
      <Tabs defaultValue="courses" className="space-y-0">
        <div className="flex w-full">
        {!sidebarHidden ? (
          <aside
            className={
              (sidebarCollapsed ? 'w-16' : 'w-72') +
              ' shrink-0 border-r border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50'
            }
          >
            <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-none">Workspace</div>
                    <div className="text-xs text-muted-foreground mt-1">Student tools & sections</div>
                  </div>
                ) : (
                  <span className="sr-only">Workspace</span>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={() => setSidebarMode(sidebarCollapsed ? 'expanded' : 'collapsed')}
                  >
                    {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Hide sidebar"
                    onClick={() => setSidebarMode('hidden')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-2">
                <TabsList className="flex flex-col items-stretch h-auto w-full bg-transparent p-0 gap-1">
                  <TabsTrigger
                    value="courses"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'My Courses' : undefined}
                  >
                    <BookOpen className="w-4 h-4" />
                    {!sidebarCollapsed ? 'My Courses' : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="assignments"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'Assignments' : undefined}
                  >
                    <FileText className="w-4 h-4" />
                    {!sidebarCollapsed ? 'Assignments' : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="grades"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'Grades' : undefined}
                  >
                    <Award className="w-4 h-4" />
                    {!sidebarCollapsed ? 'Grades' : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'Materials' : undefined}
                  >
                    <FileText className="w-4 h-4" />
                    {!sidebarCollapsed ? 'Materials' : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="announcements"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'Announcements' : undefined}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {!sidebarCollapsed ? 'Announcements' : null}
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className={sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-2'}
                    aria-label={sidebarCollapsed ? 'Calendar' : undefined}
                  >
                    <Clock className="w-4 h-4" />
                    {!sidebarCollapsed ? 'Calendar' : null}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </aside>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="px-6 py-6">
            {sidebarHidden ? (
              <div className="mb-6">
                <Button type="button" variant="outline" size="sm" onClick={() => setSidebarMode('expanded')}>
                  <Menu className="w-4 h-4 mr-2" />
                  Show Sidebar
                </Button>
              </div>
            ) : null}

            {/* Welcome Section */}
            <div className="glass-card border rounded-xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Student'}!</h2>
                  <p className="text-muted-foreground">You have {upcomingClasses.length} classes scheduled today</p>
                </div>
                <div className="hidden md:block">
                  <div className="text-right">
                    <div className="text-3xl font-bold">{format(new Date(), 'EEEE')}</div>
                    <div className="text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
                      <p className="text-3xl font-bold">{studentCourses.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                      <p className="text-3xl font-bold">95%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current GPA</p>
                      <p className="text-3xl font-bold">3.8</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
                      <p className="text-3xl font-bold">4</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Upcoming Classes */}
              <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>Your scheduled virtual classroom sessions</CardDescription>
            </CardHeader>
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
                  <span className="text-sm text-gray-600">68%</span>
                </div>
                <Progress value={68} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">On track with learning goals</p>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-3">Recent Grades</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Python Basics</span>
                    <span className="font-semibold text-green-600">95/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Integration Quiz</span>
                    <span className="font-semibold text-green-600">88/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Essay Draft</span>
                    <span className="font-semibold text-blue-600">Pending</span>
                  </div>
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
                      {studentCourses.map((course) => {
                        const grades = [
                          { name: 'Assignments', score: 92, weight: 40 },
                          { name: 'Quizzes', score: 88, weight: 30 },
                          { name: 'Midterm', score: 85, weight: 15 },
                          { name: 'Participation', score: 95, weight: 15 },
                        ];
                        const finalGrade = grades.reduce((sum, g) => sum + (g.score * g.weight) / 100, 0);

                        return (
                          <div key={course.id} className="p-4 glass-item">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="font-semibold">{course.code}</div>
                                <div className="text-sm text-gray-600">{course.title}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{finalGrade.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">A-</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {grades.map((grade, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{grade.name}</span>
                                    <span className="text-xs text-gray-400">({grade.weight}%)</span>
                                  </div>
                                  <span className="font-medium">{grade.score}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
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
                      {[
                        'Week 1: Introduction to Python',
                        'Week 2: Variables and Data Types',
                        'Week 3: Control Flow',
                        'Week 4: Functions',
                      ].map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-4 glass-item">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{material}</div>
                              <div className="text-sm text-gray-600">CS 101 - Introduction to Computer Science</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
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
