import { Link } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Video, BookOpen, FileText, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { api, ApiAssignment, ApiClassSession, ApiCourse } from '../lib/api';
import { EventsCalendar } from '../components/EventsCalendar';
import { CourseAnnouncements } from '../components/CourseAnnouncements';
import { useAuth } from '../contexts/AuthContext';
import { format, isAfter, parseISO } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentCourses, setStudentCourses] = useState<ApiCourse[]>([]);
  const [sessions, setSessions] = useState<ApiClassSession[]>([]);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const coursesRes = await api.courses();
        if (cancelled) return;
        setStudentCourses(coursesRes.data);

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

  const studentAssignments = useMemo(() => assignments.slice(0, 4), [assignments]);
  const upcomingClasses = useMemo(
    () => sessions.filter((s) => s.status === 'scheduled'),
    [sessions]
  );

  const completedAssignments = 12;
  const totalAssignments = 15;
  const completionRate = Math.round((completedAssignments / totalAssignments) * 100);

  return (
    <DashboardLayout title="Student Dashboard">
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
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 glass-item">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                          <div className="text-xs">{format(new Date(session.date), 'MMM')}</div>
                          <div className="text-xl font-bold">{format(new Date(session.date), 'd')}</div>
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
        <div>
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
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentCourses.map((course) => (
              <Card key={course.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {course.code.split(' ')[0]}
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <div>Teacher: {course.teacher}</div>
                      <div className="mt-1">{course.schedule}</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Materials</div>
                        <div className="font-semibold">{course.materials}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Assignments</div>
                        <div className="font-semibold">{course.assignments}</div>
                      </div>
                    </div>
                    <Link to={`/course/${course.id}`}>
                      <Button variant="outline" className="w-full mt-2">
                        View Course
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  const course = studentCourses.find(c => c.id === assignment.courseId);
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
                            ) : daysUntilDue <= 2 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                                <Clock className="w-3 h-3" />
                                Due soon
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{course?.code} - {course?.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{assignment.description}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-blue-600">{assignment.points} pts</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-600">
                          Due: {format(dueDate, 'MMM d, h:mm a')}
                        </div>
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
                {studentCourses.map((course, index) => {
                  const grades = [
                    { name: 'Assignments', score: 92, weight: 40 },
                    { name: 'Quizzes', score: 88, weight: 30 },
                    { name: 'Midterm', score: 85, weight: 15 },
                    { name: 'Participation', score: 95, weight: 15 },
                  ];
                  const finalGrade = grades.reduce((sum, g) => sum + (g.score * g.weight / 100), 0);

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
                {['Week 1: Introduction to Python', 'Week 2: Variables and Data Types', 'Week 3: Control Flow', 'Week 4: Functions'].map((material, index) => (
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
                    <Button variant="outline" size="sm">Download</Button>
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
