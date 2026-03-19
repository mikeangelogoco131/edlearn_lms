import { Link, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Video, BookOpen, Calendar, FileText, Users, Plus, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { api, ApiAssignment, ApiClassSession, ApiCourse } from '../lib/api';
import { EventsCalendar } from '../components/EventsCalendar';
import { CourseAnnouncements } from '../components/CourseAnnouncements';
import { Progress } from '../components/ui/progress';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacherCourses, setTeacherCourses] = useState<ApiCourse[]>([]);
  const [sessions, setSessions] = useState<ApiClassSession[]>([]);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);

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

        const assignmentsRes = await Promise.all(
          coursesRes.data.map((c) => api.courseAssignments(c.id).then((r) => r.data))
        );
        if (!cancelled) setAssignments(assignmentsRes.flat());
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

  const teacherAssignments = assignments;

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teacherCourses.map((course) => (
              <Card key={course.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.code} • {course.section}</CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{course.students} students enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{course.schedule}</span>
                    </div>
                    {course.nextClass && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Next class: {format(new Date(course.nextClass), 'MMM d, h:mm a')}</span>
                      </div>
                    )}
                    <div className="pt-3 flex gap-2">
                      <Link to={`/course/${course.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">View Course</Button>
                      </Link>
                      <Link to={`/classroom/${course.id}`} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <Video className="w-4 h-4 mr-2" />
                          Start Class
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                {teacherAssignments.map((assignment) => {
                  const course = teacherCourses.find(c => c.id === assignment.courseId);
                  const submissionRate = assignment.submitted && assignment.total 
                    ? Math.round((assignment.submitted / assignment.total) * 100)
                    : 0;
                  
                  return (
                    <div key={assignment.id} className="p-4 glass-item">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold">{assignment.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{course?.code} - {course?.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{assignment.description}</div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{assignment.points} pts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-gray-600">
                            Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, h:mm a') : '—'}
                          </div>
                          {assignment.submitted && assignment.total && (
                            <div className="flex items-center gap-2">
                              <div className="w-24">
                                <Progress value={submissionRate} />
                              </div>
                              <span className="text-gray-600">
                                {assignment.submitted}/{assignment.total} submitted
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">Grade Submissions</Button>
                      </div>
                    </div>
                  );
                })}
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
