import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Video, FileText, BookOpen, Users, Calendar, Clock, Download, 
  Play, CheckCircle, Upload, Plus, Edit, ArrowLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  api,
  ApiAssignment,
  ApiClassSession,
  ApiCourse,
  ApiCourseGradeRow,
  ApiEnrollment,
  ApiLesson,
  ApiMaterial,
  ApiMyCourseGrade,
  ApiSubmission,
  getToken,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<ApiAssignment[]>([]);
  const [courseSessions, setCourseSessions] = useState<ApiClassSession[]>([]);
  const [courseLessons, setCourseLessons] = useState<ApiLesson[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<ApiMaterial[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<ApiEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [gradebook, setGradebook] = useState<ApiCourseGradeRow[]>([]);
  const [myGrade, setMyGrade] = useState<ApiMyCourseGrade | null>(null);
  const [gradeOverrideDrafts, setGradeOverrideDrafts] = useState<Record<string, { finalGrade: string; remarks: string }>>({});

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    period: 'prelim',
    weekInPeriod: 1,
  });
  const [newLessonFile, setNewLessonFile] = useState<File | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueAt: '',
    points: 100,
    period: 'prelim',
    weekInPeriod: 1,
  });
  const [newMaterial, setNewMaterial] = useState<{ title: string; description: string; file: File | null }>({
    title: '',
    description: '',
    file: null,
  });

  const [openSubmissionsFor, setOpenSubmissionsFor] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [studentSubmissionDrafts, setStudentSubmissionDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({
    prelim: false,
    midterm: false,
    semifinals: false,
    finals: false,
  });

  const [showLessonComposer, setShowLessonComposer] = useState(false);

  const [activeTab, setActiveTab] = useState('lessons');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const periods = [
    { key: 'prelim', label: 'Prelim Period' },
    { key: 'midterm', label: 'Midterm Period' },
    { key: 'semifinals', label: 'Semi Finals Period' },
    { key: 'finals', label: 'Finals Period' },
  ] as const;

  function normalizePeriod(value: string | undefined | null) {
    const v = (value || 'prelim').toLowerCase();
    if (v === 'prelim' || v === 'midterm' || v === 'semifinals' || v === 'finals') return v;
    return 'prelim';
  }

  function normalizeWeek(value: number | undefined | null) {
    const n = Number(value || 1);
    if (Number.isFinite(n) && n >= 1 && n <= 4) return n;
    return 1;
  }

  const handleBackToDashboard = () => {
    if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!courseId) return;
      setLoading(true);

      try {
        const [courseRes, assignmentsRes, sessionsRes, lessonsRes, materialsRes] = await Promise.all([
          api.course(courseId),
          api.courseAssignments(courseId),
          api.courseSessions(courseId),
          api.courseLessons(courseId),
          api.courseMaterials(courseId),
        ]);

        const gradeRes = isTeacher
          ? await api.courseGrades(courseId)
          : isStudent
            ? await api.myCourseGrade(courseId)
            : null;

        if (cancelled) return;
        setCourse(courseRes.data);
        setCourseAssignments(assignmentsRes.data);
        setCourseSessions(sessionsRes.data);
        setCourseLessons(lessonsRes.data);
        setCourseMaterials(materialsRes.data);
        if (gradeRes && 'data' in gradeRes && Array.isArray((gradeRes as any).data)) {
          setGradebook((gradeRes as any).data as ApiCourseGradeRow[]);
        } else if (gradeRes && 'data' in gradeRes && !Array.isArray((gradeRes as any).data)) {
          setMyGrade((gradeRes as any).data as ApiMyCourseGrade);
        } else {
          setGradebook([]);
          setMyGrade(null);
        }
      } catch {
        if (!cancelled) {
          setCourse(null);
          setCourseAssignments([]);
          setCourseSessions([]);
          setCourseLessons([]);
          setCourseMaterials([]);
          setGradebook([]);
          setMyGrade(null);
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

  useEffect(() => {
    setGradeOverrideDrafts((prev) => {
      const next = { ...prev };
      for (const row of gradebook) {
        if (!next[row.student.id]) {
          next[row.student.id] = {
            finalGrade: row.finalGrade != null ? String(row.finalGrade) : '',
            remarks: row.remarks || '',
          };
        }
      }
      return next;
    });
  }, [gradebook]);

  const avgCoursePercent = useMemo(() => {
    if (isStudent) {
      const percent = myGrade?.finalGrade ?? myGrade?.computedPercent;
      return typeof percent === 'number' ? percent : null;
    }
    return null;
  }, [isStudent, myGrade]);

  async function refreshLessonsMaterials() {
    if (!courseId) return;
    const [lessonsRes, materialsRes] = await Promise.all([
      api.courseLessons(courseId),
      api.courseMaterials(courseId),
    ]);
    setCourseLessons(lessonsRes.data);
    setCourseMaterials(materialsRes.data);
  }

  async function refreshAssignments() {
    if (!courseId) return;
    const assignmentsRes = await api.courseAssignments(courseId);
    setCourseAssignments(assignmentsRes.data);
  }

  async function refreshGrades() {
    if (!courseId) return;
    if (isTeacher) {
      const gradeRes = await api.courseGrades(courseId);
      setGradebook(gradeRes.data);
    } else if (isStudent) {
      const gradeRes = await api.myCourseGrade(courseId);
      setMyGrade(gradeRes.data);
    }
  }

  async function loadEnrollments() {
    if (!courseId) return;
    setLoadingEnrollments(true);
    try {
      const res = await api.courseEnrollments(courseId);
      setCourseEnrollments(res.data);
    } catch (e) {
      setCourseEnrollments([]);
      const msg = e instanceof Error ? e.message : 'Failed to load students';
      toast.error(msg);
    } finally {
      setLoadingEnrollments(false);
    }
  }

  async function handleCreateLesson() {
    if (!courseId) return;
    const trimmedTitle = newLesson.title.trim();
    const fallbackTitle = newLessonFile?.name ? newLessonFile.name : '';
    const lessonTitle = trimmedTitle || fallbackTitle;
    if (!lessonTitle) {
      toast.error('Add a title or choose a file.');
      return;
    }
    setSaving(true);
    try {
      await api.createCourseLesson(courseId, {
        title: lessonTitle,
        description: newLesson.description || null,
        content: newLesson.content || null,
        duration: newLesson.duration || null,
        period: newLesson.period,
        week_in_period: newLesson.weekInPeriod,
      });
      if (newLessonFile) {
        try {
          await api.uploadCourseMaterial(courseId, {
            title: lessonTitle,
            description: newLesson.description || undefined,
            file: newLessonFile,
            period: newLesson.period,
            week_in_period: newLesson.weekInPeriod,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'File upload failed';
          toast.error(`Lesson saved, but file upload failed: ${msg}`);
        }
      }
      setNewLesson({ title: '', description: '', content: '', duration: '', period: 'prelim', weekInPeriod: 1 });
      setNewLessonFile(null);
      setShowLessonComposer(false);
      await refreshLessonsMaterials();
      toast.success('Lesson added');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add lesson';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!courseId) return;
    setSaving(true);
    try {
      await api.deleteCourseLesson(courseId, lessonId);
      await refreshLessonsMaterials();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAssignment() {
    if (!courseId) return;
    if (!newAssignment.title.trim()) return;
    setSaving(true);
    try {
      await api.createCourseAssignment(courseId, {
        title: newAssignment.title.trim(),
        description: newAssignment.description || null,
        due_at: newAssignment.dueAt || null,
        points: Number(newAssignment.points) || 0,
        period: newAssignment.period,
        week_in_period: newAssignment.weekInPeriod,
      });
      setNewAssignment({ title: '', description: '', dueAt: '', points: 100, period: 'prelim', weekInPeriod: 1 });
      await refreshAssignments();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!courseId) return;
    setSaving(true);
    try {
      await api.deleteCourseAssignment(courseId, assignmentId);
      if (openSubmissionsFor === assignmentId) {
        setOpenSubmissionsFor(null);
        setSubmissions([]);
      }
      await refreshAssignments();
      await refreshGrades();
    } finally {
      setSaving(false);
    }
  }

  async function toggleSubmissions(assignmentId: string) {
    if (openSubmissionsFor === assignmentId) {
      setOpenSubmissionsFor(null);
      setSubmissions([]);
      return;
    }
    setOpenSubmissionsFor(assignmentId);
    const res = await api.assignmentSubmissions(assignmentId);
    setSubmissions(res.data);
  }

  async function handleGradeSubmission(submissionId: string) {
    const draft = gradingDrafts[submissionId];
    if (!draft) return;
    const gradeNum = Number(draft.grade);
    if (!Number.isFinite(gradeNum)) return;
    setSaving(true);
    try {
      await api.gradeSubmission(submissionId, { grade: gradeNum, feedback: draft.feedback || null });
      if (openSubmissionsFor) {
        const res = await api.assignmentSubmissions(openSubmissionsFor);
        setSubmissions(res.data);
      }
      await refreshGrades();
    } finally {
      setSaving(false);
    }
  }

  async function handleStudentSubmit(assignmentId: string) {
    const content = studentSubmissionDrafts[assignmentId] || '';
    setSaving(true);
    try {
      await api.createSubmission(assignmentId, { content });
      if (openSubmissionsFor === assignmentId) {
        const res = await api.assignmentSubmissions(assignmentId);
        setSubmissions(res.data);
      }
      await refreshGrades();
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMaterial() {
    if (!courseId) return;
    if (!newMaterial.file) return;
    setSaving(true);
    try {
      await api.uploadCourseMaterial(courseId, {
        title: newMaterial.title || undefined,
        description: newMaterial.description || undefined,
        file: newMaterial.file,
      });
      setNewMaterial({ title: '', description: '', file: null });
      await refreshLessonsMaterials();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!courseId) return;
    setSaving(true);
    try {
      await api.deleteCourseMaterial(courseId, materialId);
      await refreshLessonsMaterials();
    } finally {
      setSaving(false);
    }
  }

  async function handleSetFinalGrade(studentId: string, finalGrade: string, remarks: string) {
    if (!courseId) return;
    const gradeNum = finalGrade.trim() === '' ? null : Number(finalGrade);
    if (finalGrade.trim() !== '' && !Number.isFinite(gradeNum)) return;
    setSaving(true);
    try {
      await api.setCourseGrade(courseId, studentId, { final_grade: gradeNum, remarks: remarks || null });
      await refreshGrades();
    } finally {
      setSaving(false);
    }
  }

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
          <Button className="mt-4" onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeAssignments = courseAssignments;

  async function downloadMaterial(material: ApiMaterial) {
    try {
      const token = getToken();
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8010';
      const res = await fetch(`${baseUrl}${material.downloadPath}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.originalName || material.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  }

  async function openMaterial(material: ApiMaterial) {
    try {
      const token = getToken();
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8010';
      const res = await fetch(`${baseUrl}${material.downloadPath}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Open failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give the new tab time to load the blob.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Failed to open file');
    }
  }

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
              <Button variant="outline" onClick={handleBackToDashboard} aria-label="Back to dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Button>
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'students' && isTeacher && courseEnrollments.length === 0 && !loadingEnrollments) {
            void loadEnrollments();
          }
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="sessions">Class Sessions</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          {isTeacher && <TabsTrigger value="students">Students</TabsTrigger>}
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Course Curriculum</CardTitle>
                  <CardDescription>
                    {isTeacher ? 'Create and manage lessons for this subject' : 'Follow the lessons for this subject'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const allExpanded = periods.every((p) => expandedPeriods[p.key]);
                      setExpandedPeriods({
                        prelim: !allExpanded,
                        midterm: !allExpanded,
                        semifinals: !allExpanded,
                        finals: !allExpanded,
                      });
                    }}
                  >
                    {periods.every((p) => expandedPeriods[p.key]) ? (
                      <ChevronUp className="w-4 h-4 mr-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    )}
                    {periods.every((p) => expandedPeriods[p.key]) ? 'Hide sections' : 'Show sections'}
                  </Button>
                  {isTeacher && (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setShowLessonComposer((prev) => {
                          const next = !prev;
                          if (next) {
                            setTimeout(() => {
                              document.getElementById('lesson-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 0);
                          }
                          return next;
                        });
                      }}
                      disabled={saving}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lesson
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {isTeacher && showLessonComposer && (
                  <Card className="bg-gray-50" id="lesson-composer">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Period</div>
                          <Select value={newLesson.period} onValueChange={(v) => setNewLesson((s) => ({ ...s, period: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((p) => (
                                <SelectItem key={p.key} value={p.key}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Week</div>
                          <Select value={String(newLesson.weekInPeriod)} onValueChange={(v) => setNewLesson((s) => ({ ...s, weekInPeriod: Number(v) }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((w) => (
                                <SelectItem key={w} value={String(w)}>
                                  Week {w}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Title</div>
                          <Input value={newLesson.title} onChange={(e) => setNewLesson((s) => ({ ...s, title: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Duration (optional)</div>
                          <Input value={newLesson.duration} onChange={(e) => setNewLesson((s) => ({ ...s, duration: e.target.value }))} placeholder="e.g. 45 min" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Description (optional)</div>
                        <Input value={newLesson.description} onChange={(e) => setNewLesson((s) => ({ ...s, description: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Lesson content (optional)</div>
                        <Textarea value={newLesson.content} onChange={(e) => setNewLesson((s) => ({ ...s, content: e.target.value }))} rows={4} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Upload file (optional)</div>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setNewLessonFile(file);
                            if (file && !newLesson.title.trim()) {
                              setNewLesson((s) => ({ ...s, title: file.name }));
                            }
                          }}
                        />
                        <div className="text-xs text-gray-600">Docs, PPTX, PDFs, etc. will be uploaded as a lesson file in the selected week.</div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowLessonComposer(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={handleCreateLesson}
                          disabled={saving || !(newLesson.title.trim() || newLessonFile)}
                        >
                          Save Lesson
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {periods.map((period) => {
                    const periodLessons = courseLessons.filter((l) => normalizePeriod(l.period) === period.key);
                    const periodAssessments = courseAssignments.filter((a) => normalizePeriod(a.period) === period.key);
                    const periodMaterials = courseMaterials.filter((m) => normalizePeriod(m.period) === period.key);

                    const weekHasAnything = (week: number) => {
                      const hasLesson = periodLessons.some((l) => normalizeWeek(l.weekInPeriod) === week);
                      const hasAssessment = periodAssessments.some((a) => normalizeWeek(a.weekInPeriod) === week);
                      const hasFile = periodMaterials.some((m) => normalizeWeek(m.weekInPeriod) === week);
                      return hasLesson || hasAssessment || hasFile;
                    };

                    const coveredWeeks = [1, 2, 3, 4].filter(weekHasAnything).length;
                    const progressPercent = Math.round((coveredWeeks / 4) * 100);
                    const firstWeekWithContent = [1, 2, 3, 4].find(weekHasAnything) || 1;
                    const isExpanded = !!expandedPeriods[period.key];

                    return (
                      <Card key={period.key}>
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-64 p-4">
                              <div className="w-full aspect-video rounded-lg bg-gray-100 border flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">{course.code}</div>
                                  <div className="text-lg font-semibold">{period.label}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 p-4 md:pl-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-lg font-semibold">{period.label}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {periodLessons.length} lessons • {periodAssessments.length} assessments • {periodMaterials.length} files
                                  </div>
                                  <div className="mt-3 max-w-md">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="text-gray-600">{progressPercent}% curriculum coverage</div>
                                      <div className="text-gray-600">{coveredWeeks}/4 weeks</div>
                                    </div>
                                    <Progress value={progressPercent} className="mt-2" />
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setExpandedPeriods((prev) => ({ ...prev, [period.key]: true }));
                                      setTimeout(() => {
                                        document
                                          .getElementById(`period-${period.key}-week-${firstWeekWithContent}`)
                                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 0);
                                    }}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => setExpandedPeriods((prev) => ({ ...prev, [period.key]: !isExpanded }))}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 mr-2" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 mr-2" />
                                    )}
                                    {isExpanded ? 'Hide sections' : 'Show sections'}
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-end mt-3 text-sm text-gray-600">
                                4 sections
                              </div>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="border-t p-4 space-y-3">
                              {[1, 2, 3, 4].map((week) => {
                                const weekLessons = courseLessons
                                  .filter((l) => normalizePeriod(l.period) === period.key && normalizeWeek(l.weekInPeriod) === week)
                                  .slice()
                                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                                const weekAssessments = courseAssignments
                                  .filter((a) => normalizePeriod(a.period) === period.key && normalizeWeek(a.weekInPeriod) === week)
                                  .slice()
                                  .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
                                const weekMaterials = courseMaterials
                                  .filter((m) => normalizePeriod(m.period) === period.key && normalizeWeek(m.weekInPeriod) === week)
                                  .slice()
                                  .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

                                return (
                                  <div
                                    key={week}
                                    id={`period-${period.key}-week-${week}`}
                                    className="p-4 bg-gray-50 rounded-lg space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-semibold">Week {week}</div>
                                      <div className="text-sm text-gray-600">
                                        {weekLessons.length} lessons • {weekAssessments.length} assessments • {weekMaterials.length} files
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="text-sm font-medium">Lessons</div>
                                      {weekLessons.length === 0 ? (
                                        <div className="text-sm text-gray-600">No lessons.</div>
                                      ) : (
                                        <div className="space-y-2">
                                          {weekLessons.map((lesson) => (
                                            <div key={lesson.id} className="flex items-start justify-between gap-3 bg-white border rounded-md p-3">
                                              <div className="min-w-0">
                                                <div className="font-medium">{lesson.title}</div>
                                                {lesson.description ? (
                                                  <div className="text-sm text-gray-600 mt-1">{lesson.description}</div>
                                                ) : null}
                                                <div className="text-xs text-gray-500 mt-1">{lesson.duration || '—'}</div>
                                              </div>
                                              {isTeacher && (
                                                <Button variant="outline" size="sm" onClick={() => handleDeleteLesson(lesson.id)} disabled={saving}>
                                                  Delete
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2 pt-2">
                                      <div className="text-sm font-medium">Assessments</div>
                                      {weekAssessments.length === 0 ? (
                                        <div className="text-sm text-gray-600">No assessments.</div>
                                      ) : (
                                        <div className="space-y-2">
                                          {weekAssessments.map((a) => (
                                            <div key={a.id} className="flex items-start justify-between gap-3 bg-white border rounded-md p-3">
                                              <div className="min-w-0">
                                                <div className="font-medium">{a.title}</div>
                                                <div className="text-sm text-gray-600">
                                                  {a.dueDate ? `Due: ${format(new Date(a.dueDate), 'MMM d, h:mm a')}` : 'No due date'} • {a.points} pts
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2 pt-2">
                                      <div className="text-sm font-medium">Lesson Files</div>
                                      {weekMaterials.length === 0 ? (
                                        <div className="text-sm text-gray-600">No files.</div>
                                      ) : (
                                        <div className="space-y-2">
                                          {weekMaterials.map((m) => (
                                            <div key={m.id} className="flex items-center justify-between gap-3 bg-white border rounded-md p-3">
                                              <button
                                                type="button"
                                                className="min-w-0 text-left group"
                                                onClick={() => openMaterial(m)}
                                                aria-label={`Open ${m.title || m.originalName}`}
                                              >
                                                <div className="font-medium truncate group-hover:underline">{m.title}</div>
                                                <div className="text-sm text-gray-600 truncate group-hover:underline">{m.originalName}</div>
                                              </button>
                                              <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openMaterial(m)}>
                                                  Open
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => downloadMaterial(m)}>
                                                  <Download className="w-4 h-4 mr-2" />
                                                  Download
                                                </Button>
                                                {isTeacher && (
                                                  <Button variant="outline" size="sm" onClick={() => handleDeleteMaterial(m.id)} disabled={saving}>
                                                    Delete
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Course Assessments</CardTitle>
                  <CardDescription>
                    {isTeacher ? 'Create assessments and grade student submissions' : 'Complete and submit your assessments on time'}
                  </CardDescription>
                </div>
                {isTeacher && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateAssignment} disabled={saving || !newAssignment.title.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assessment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {isTeacher && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Period</div>
                          <Select value={newAssignment.period} onValueChange={(v) => setNewAssignment((s) => ({ ...s, period: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((p) => (
                                <SelectItem key={p.key} value={p.key}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Week</div>
                          <Select value={String(newAssignment.weekInPeriod)} onValueChange={(v) => setNewAssignment((s) => ({ ...s, weekInPeriod: Number(v) }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((w) => (
                                <SelectItem key={w} value={String(w)}>
                                  Week {w}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Title</div>
                          <Input value={newAssignment.title} onChange={(e) => setNewAssignment((s) => ({ ...s, title: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Points</div>
                          <Input type="number" value={String(newAssignment.points)} onChange={(e) => setNewAssignment((s) => ({ ...s, points: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Due at (optional)</div>
                          <Input type="datetime-local" value={newAssignment.dueAt} onChange={(e) => setNewAssignment((s) => ({ ...s, dueAt: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Description (optional)</div>
                          <Input value={newAssignment.description} onChange={(e) => setNewAssignment((s) => ({ ...s, description: e.target.value }))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeAssignments.length === 0 ? (
                  <div className="text-sm text-gray-600">No assessments.</div>
                ) : (
                  activeAssignments.map((assignment) => (
                    <Card key={assignment.id} className="bg-gray-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold">{assignment.title}</div>
                            {assignment.description ? (
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            ) : null}
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              <div>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, h:mm a') : '—'}</div>
                              <div>{assignment.points} points</div>
                              {typeof assignment.submitted === 'number' && typeof assignment.total === 'number' ? (
                                <div>
                                  {assignment.submitted}/{assignment.total} submitted
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isTeacher ? (
                              <>
                                <Button variant="outline" onClick={() => toggleSubmissions(assignment.id)}>
                                  {openSubmissionsFor === assignment.id ? 'Hide' : 'Submissions'}
                                </Button>
                                <Button variant="outline" onClick={() => handleDeleteAssignment(assignment.id)} disabled={saving}>
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" onClick={() => toggleSubmissions(assignment.id)}>
                                {openSubmissionsFor === assignment.id ? 'Hide' : 'My Submission'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {isStudent && (
                          <div className="space-y-2 pt-3 border-t">
                            <div className="text-sm font-medium">Submit answer (text)</div>
                            <Textarea
                              value={studentSubmissionDrafts[assignment.id] || ''}
                              onChange={(e) => setStudentSubmissionDrafts((s) => ({ ...s, [assignment.id]: e.target.value }))}
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStudentSubmit(assignment.id)} disabled={saving}>
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </Button>
                            </div>
                          </div>
                        )}

                        {openSubmissionsFor === assignment.id && (
                          <div className="pt-3 border-t space-y-3">
                            {submissions.length === 0 ? (
                              <div className="text-sm text-gray-600">No submissions yet.</div>
                            ) : (
                              submissions.map((s) => {
                                const draft = gradingDrafts[s.id] || { grade: s.grade != null ? String(s.grade) : '', feedback: s.feedback || '' };
                                const canGrade = isTeacher;
                                return (
                                  <div key={s.id} className="p-3 bg-white rounded-md border">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="font-medium">
                                          {s.student ? s.student.name : 'You'}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Status: {s.status}{s.submittedAt ? ` • Submitted ${format(new Date(s.submittedAt), 'MMM d, h:mm a')}` : ''}
                                        </div>
                                        {s.content ? (
                                          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{s.content}</div>
                                        ) : null}
                                      </div>

                                      {canGrade && (
                                        <div className="w-64 space-y-2">
                                          <Input
                                            type="number"
                                            placeholder="Grade"
                                            value={draft.grade}
                                            onChange={(e) =>
                                              setGradingDrafts((prev) => ({
                                                ...prev,
                                                [s.id]: { ...draft, grade: e.target.value },
                                              }))
                                            }
                                          />
                                          <Textarea
                                            placeholder="Feedback (optional)"
                                            value={draft.feedback}
                                            onChange={(e) =>
                                              setGradingDrafts((prev) => ({
                                                ...prev,
                                                [s.id]: { ...draft, feedback: e.target.value },
                                              }))
                                            }
                                            rows={2}
                                          />
                                          <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => handleGradeSubmission(s.id)}
                                            disabled={saving}
                                          >
                                            Save Grade
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Course Materials</CardTitle>
                  <CardDescription>
                    {isTeacher ? 'Upload and manage course files (docs, PPTX, PDFs, etc.)' : 'Download course files and resources'}
                  </CardDescription>
                </div>
                {isTeacher && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUploadMaterial} disabled={saving || !newMaterial.file}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isTeacher && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Title (optional)</div>
                          <Input value={newMaterial.title} onChange={(e) => setNewMaterial((s) => ({ ...s, title: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">File</div>
                          <Input type="file" onChange={(e) => setNewMaterial((s) => ({ ...s, file: e.target.files?.[0] || null }))} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Description (optional)</div>
                        <Input value={newMaterial.description} onChange={(e) => setNewMaterial((s) => ({ ...s, description: e.target.value }))} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {courseMaterials.length === 0 ? (
                  <div className="text-sm text-gray-600">No materials.</div>
                ) : (
                  courseMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <button
                          type="button"
                          className="min-w-0 text-left group"
                          onClick={() => openMaterial(material)}
                          aria-label={`Open ${material.title || material.originalName}`}
                        >
                          <div className="font-medium truncate group-hover:underline">{material.title}</div>
                          <div className="text-sm text-gray-600 truncate group-hover:underline">
                            {material.originalName} • {(material.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openMaterial(material)}>
                          Open
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadMaterial(material)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        {isTeacher && (
                          <Button variant="outline" size="sm" onClick={() => handleDeleteMaterial(material.id)} disabled={saving}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
              <CardTitle>{isTeacher ? 'Gradebook' : 'Your Grades'}</CardTitle>
              <CardDescription>
                {isTeacher ? 'Set final grades and review computed performance' : 'Track your performance in this course'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTeacher ? (
                <div className="space-y-3">
                  {gradebook.length === 0 ? (
                    <div className="text-sm text-gray-600">No enrolled students.</div>
                  ) : (
                    gradebook.map((row) => {
                      const draft = gradeOverrideDrafts[row.student.id] || {
                        finalGrade: row.finalGrade != null ? String(row.finalGrade) : '',
                        remarks: row.remarks || '',
                      };
                      const final = row.finalGrade ?? row.computedPercent;
                      const finalText = typeof final === 'number' ? `${final.toFixed(2)}%` : '—';
                      return (
                        <div key={row.student.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="font-semibold">{row.student.name}</div>
                              <div className="text-sm text-gray-600">{row.student.email}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                Computed: {row.computedPercent != null ? `${row.computedPercent.toFixed(2)}%` : '—'} • Graded: {row.gradedCount}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Final</div>
                              <div className="text-xl font-bold text-blue-600">{finalText}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">Final grade override (%)</div>
                              <Input
                                type="number"
                                placeholder="Leave blank to use computed"
                                value={draft.finalGrade}
                                onChange={(e) =>
                                  setGradeOverrideDrafts((prev) => ({
                                    ...prev,
                                    [row.student.id]: { ...draft, finalGrade: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <div className="text-sm font-medium">Remarks (optional)</div>
                              <Input
                                placeholder="Remarks"
                                value={draft.remarks}
                                onChange={(e) =>
                                  setGradeOverrideDrafts((prev) => ({
                                    ...prev,
                                    [row.student.id]: { ...draft, remarks: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleSetFinalGrade(row.student.id, draft.finalGrade, draft.remarks)}
                              disabled={saving}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Grade</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {avgCoursePercent != null ? `${avgCoursePercent.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                    <Progress value={avgCoursePercent ?? 0} className="h-3" />
                    <p className="text-sm text-gray-600 mt-1">
                      {myGrade?.finalGrade != null ? 'Final grade set by teacher.' : 'Computed from graded submissions.'}
                      {myGrade?.remarks ? ` • ${myGrade.remarks}` : ''}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    Graded assessments: {myGrade?.gradedCount ?? 0}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isTeacher && (
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Students</CardTitle>
                    <CardDescription>Students enrolled under this subject</CardDescription>
                  </div>
                  <Button variant="outline" onClick={loadEnrollments} disabled={loadingEnrollments}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEnrollments ? (
                  <div className="text-sm text-gray-600">Loading students...</div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="text-sm text-gray-600">No students enrolled.</div>
                ) : (
                  <div className="space-y-2">
                    {courseEnrollments
                      .slice()
                      .sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''))
                      .map((enrollment) => (
                        <div key={enrollment.id} className="flex items-start justify-between gap-3 bg-gray-50 border rounded-lg p-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{enrollment.student?.name || 'Student'}</div>
                            <div className="text-sm text-gray-600 truncate">{enrollment.student?.email || '—'}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {enrollment.status}
                              {enrollment.enrolledAt ? ` • Enrolled ${format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
