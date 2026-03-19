import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  Video, FileText, BookOpen, Users, Calendar, Clock, Download, 
  Play, CheckCircle, Upload, Plus, Edit
} from 'lucide-react';
import { api, ApiAssignment, ApiClassSession, ApiCourse } from '../lib/api';
import { format } from 'date-fns';

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<ApiAssignment[]>([]);
  const [courseSessions, setCourseSessions] = useState<ApiClassSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!courseId) return;
      setLoading(true);

      try {
        const [courseRes, assignmentsRes, sessionsRes] = await Promise.all([
          api.course(courseId),
          api.courseAssignments(courseId),
          api.courseSessions(courseId),
        ]);

        if (cancelled) return;
        setCourse(courseRes.data);
        setCourseAssignments(assignmentsRes.data);
        setCourseSessions(sessionsRes.data);
      } catch {
        if (!cancelled) {
          setCourse(null);
          setCourseAssignments([]);
          setCourseSessions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout title="Course Not Found">
        <div className="text-center py-12">
          <p className="text-gray-600">Course not found</p>
          <Link to="/student">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const lessons = [
    { 
      week: 1, 
      title: 'Introduction to Programming', 
      description: 'Overview of programming concepts and Python basics',
      materials: 3,
      duration: '45 min',
      completed: true 
    },
    { 
      week: 2, 
      title: 'Variables and Data Types', 
      description: 'Understanding variables, strings, numbers, and booleans',
      materials: 5,
      duration: '60 min',
      completed: true 
    },
    { 
      week: 3, 
      title: 'Control Flow', 
      description: 'If statements, loops, and conditional logic',
      materials: 4,
      duration: '55 min',
      completed: false 
    },
    { 
      week: 4, 
      title: 'Functions and Modules', 
      description: 'Creating reusable code with functions',
      materials: 6,
      duration: '70 min',
      completed: false 
    },
  ];

  const materials = [
    { name: 'Week 1 Lecture Slides.pdf', type: 'PDF', size: '2.4 MB', date: '2026-02-10' },
    { name: 'Python Installation Guide.pdf', type: 'PDF', size: '1.8 MB', date: '2026-02-10' },
    { name: 'Introduction Video.mp4', type: 'Video', size: '45 MB', date: '2026-02-10' },
    { name: 'Week 2 Code Examples.zip', type: 'ZIP', size: '0.5 MB', date: '2026-02-15' },
    { name: 'Variables Tutorial.pdf', type: 'PDF', size: '3.2 MB', date: '2026-02-15' },
  ];

  return (
    <DashboardLayout title={course.title}>
      {/* Course Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {course.code.split(' ')[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{course.title}</h2>
                  <p className="text-gray-600">{course.code} • {course.section}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{course.teacher}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{course.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{course.term}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/classroom/${course.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Video className="w-4 h-4 mr-2" />
                  Join Live Class
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{course.materials}</div>
              <div className="text-sm text-gray-600">Materials</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{course.assignments}</div>
              <div className="text-sm text-gray-600">Assignments</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{course.students}</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">68%</div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="sessions">Class Sessions</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>Follow the weekly lessons and complete all materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.week} className={lesson.completed ? 'bg-green-50 border-green-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {lesson.week}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{lesson.title}</h3>
                              {lesson.completed && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Completed
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {lesson.materials} materials
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {lesson.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant={lesson.completed ? "outline" : "default"}>
                          {lesson.completed ? 'Review' : 'Start Learning'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Assignments</CardTitle>
              <CardDescription>Complete and submit your assignments on time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{assignment.title}</div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, h:mm a') : '—'}</div>
                          <div>{assignment.points} points</div>
                        </div>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Download lecture slides, videos, and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-gray-600">
                          {material.type} • {material.size} • Uploaded {format(new Date(material.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Sessions</CardTitle>
              <CardDescription>Live and recorded classroom sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                        {(() => {
                          const dateString = session.startsAt || session.date;
                          if (!dateString) {
                            return (
                              <>
                                <div className="text-xs">—</div>
                                <div className="text-2xl font-bold">—</div>
                              </>
                            );
                          }
                          const d = new Date(dateString);
                          return (
                            <>
                              <div className="text-xs">{format(d, 'MMM')}</div>
                              <div className="text-2xl font-bold">{format(d, 'd')}</div>
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="font-semibold">{session.title}</div>
                        <div className="text-sm text-gray-600">
                          {session.time} • {session.duration}
                        </div>
                        {session.status === 'completed' && (
                          <div className="text-sm text-green-600 mt-1">
                            Recording available • {session.attendees} attended
                          </div>
                        )}
                      </div>
                    </div>
                    {session.status === 'scheduled' ? (
                      <Link to={`/classroom/${courseId}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Video className="w-4 h-4 mr-2" />
                          Join Class
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Recording
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Grades</CardTitle>
              <CardDescription>Track your performance in this course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Grade</span>
                  <span className="text-2xl font-bold text-blue-600">91.5%</span>
                </div>
                <Progress value={91.5} className="h-3" />
                <p className="text-sm text-gray-600 mt-1">Grade: A-</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Assignments</div>
                    <div className="text-lg font-bold text-blue-600">92%</div>
                  </div>
                  <Progress value={92} className="h-2 mb-1" />
                  <p className="text-xs text-gray-600">Weight: 40% of final grade</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Quizzes</div>
                    <div className="text-lg font-bold text-blue-600">88%</div>
                  </div>
                  <Progress value={88} className="h-2 mb-1" />
                  <p className="text-xs text-gray-600">Weight: 30% of final grade</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Midterm Exam</div>
                    <div className="text-lg font-bold text-blue-600">85%</div>
                  </div>
                  <Progress value={85} className="h-2 mb-1" />
                  <p className="text-xs text-gray-600">Weight: 15% of final grade</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Participation</div>
                    <div className="text-lg font-bold text-blue-600">95%</div>
                  </div>
                  <Progress value={95} className="h-2 mb-1" />
                  <p className="text-xs text-gray-600">Weight: 15% of final grade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
