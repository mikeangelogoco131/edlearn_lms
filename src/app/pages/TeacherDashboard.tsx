import { Link } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Video,
  BookOpen,
  Calendar,
  FileText,
  Users,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { api, ApiClassSession, ApiCourse } from '../lib/api';
import { EventsCalendar } from '../components/EventsCalendar';
import { CourseAnnouncements } from '../components/CourseAnnouncements';
import { format } from 'date-fns';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function TeacherDashboard() {
  const [teacherCourses, setTeacherCourses] = useState<ApiCourse[]>([]);
  const [sessions, setSessions] = useState<ApiClassSession[]>([]);
  const [coursesView, setCoursesView] = useState<'enrolled' | 'completed'>('enrolled');
  const coursesScrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const coursesRes = await api.courses();
        if (cancelled) return;
        setTeacherCourses(coursesRes.data);

        const sessionsRes = await Promise.all(
          coursesRes.data.map((c) => api.courseSessions(c.id).then((r) => r.data))
        );
        if (!cancelled) setSessions(sessionsRes.flat());
      } catch {
        // Keep UI stable if API is unavailable
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === 'scheduled'),
    [sessions]
  );

  const enrolledCourses = useMemo(
    () => teacherCourses.filter((c) => (c.status || '').toLowerCase() !== 'completed'),
    [teacherCourses]
  );
  const completedCoursesList = useMemo(
    () => teacherCourses.filter((c) => (c.status || '').toLowerCase() === 'completed'),
    [teacherCourses]
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

  const teacherAssignments: unknown[] = [];

  return (
    <DashboardLayout title="Teacher Dashboard">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button className="h-auto py-6 bg-blue-600 hover:bg-blue-700 flex flex-col gap-2">
          <Video className="w-6 h-6" />
          <span>Start Live Class</span>
        </Button>
        <Button className="h-auto py-6 bg-green-600 hover:bg-green-700 flex flex-col gap-2">
          <Plus className="w-6 h-6" />
          <span>Create Assignment</span>
        </Button>
        <Button className="h-auto py-6 bg-purple-600 hover:bg-purple-700 flex flex-col gap-2">
          <Calendar className="w-6 h-6" />
          <span>Schedule Class</span>
        </Button>
        <Button className="h-auto py-6 bg-orange-600 hover:bg-orange-700 flex flex-col gap-2">
          <FileText className="w-6 h-6" />
          <span>Upload Material</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Courses</p>
                <p className="text-3xl font-bold">{teacherCourses.length}</p>
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
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold">
                  {teacherCourses.reduce((sum, course) => sum + course.students, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Classes</p>
                <p className="text-3xl font-bold">{upcomingSessions.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Grading</p>
                <p className="text-3xl font-bold">23</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedule">Class Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

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
              <Button type="button" variant="outline" size="icon" onClick={() => scrollCourses('left')} aria-label="Scroll courses left">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => scrollCourses('right')} aria-label="Scroll courses right">
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
              const actionLabel = 'Manage';

              return (
                <Card
                  key={course.id}
                  className="glass-card w-[280px] sm:w-[320px] flex-shrink-0 overflow-hidden snap-start"
                >
                  <Link to={`/course/${course.id}`} className="block" aria-label={`Manage ${course.code} ${course.title}`}>
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
                    <Link to={`/course/${course.id}`} className="block space-y-1" aria-label={`Manage ${course.code} ${course.title}`}>
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
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.students}</span>
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

        <TabsContent value="schedule" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Classes</CardTitle>
                  <CardDescription>Your scheduled virtual classroom sessions</CardDescription>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => {
                  const course = teacherCourses.find(c => c.id === session.courseId);
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 glass-item">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                          <div className="text-xs font-medium">{format(new Date(session.date), 'MMM')}</div>
                          <div className="text-2xl font-bold">{format(new Date(session.date), 'd')}</div>
                        </div>
                        <div>
                          <div className="font-semibold">{session.title}</div>
                          <div className="text-sm text-gray-600">{course?.code} - {course?.section}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {session.time} • {session.duration}
                          </div>
                        </div>
                      </div>
                      <Link to={`/classroom/${session.courseId}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Video className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <EventsCalendar canManage={false} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <CourseAnnouncements courses={teacherCourses} canPost={true} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assignments & Assessments</CardTitle>
                  <CardDescription>Manage and grade student submissions</CardDescription>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
				{teacherAssignments.length === 0 ? (
					<div className="text-sm text-muted-foreground">No assignments.</div>
				) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Student Overview</CardTitle>
              <CardDescription>Track student performance and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Alex Martinez', 'Emma Wilson', 'James Brown', 'Sophia Chen', 'Michael Johnson'].map((name, index) => (
                  <div key={index} className="flex items-center justify-between p-4 glass-item">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold">{name}</div>
                        <div className="text-sm text-gray-600">3 courses enrolled</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">92% Avg</div>
                        <div className="text-xs text-gray-600">95% Attendance</div>
                      </div>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
