import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
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
  Play, CheckCircle, Upload, Plus, Edit, ArrowLeft, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import {
  api,
  ApiAssignment,
  ApiAttendanceStatus,
  ApiClassSession,
  ApiCourse,
  ApiCourseGradeRow,
  ApiEnrollment,
  ApiLesson,
  ApiMaterial,
  ApiMyCourseGrade,
  ApiSubmission,
  ApiUser,
  attendanceApi,
  getApiBaseUrl,
  getToken,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function QuizBuilder({
  quizData,
  onChange,
  disabled
}: {
  quizData: { questions: Array<{ question: string; options: string[]; correctAnswer: string; points: number }> } | null;
  onChange: (data: { questions: Array<{ question: string; options: string[]; correctAnswer: string; points: number }> } | null) => void;
  disabled?: boolean;
}) {
  const data = quizData || { questions: [] };

  const addQuestion = () => {
    onChange({
      questions: [
        ...data.questions,
        { question: '', options: ['', ''], correctAnswer: '', points: 1 }
      ]
    });
  };

  const updateQuestion = (idx: number, updates: any) => {
    const q = [...data.questions];
    q[idx] = { ...q[idx], ...updates };
    onChange({ questions: q });
  };

  const removeQuestion = (idx: number) => {
    const q = data.questions.filter((_, i) => i !== idx);
    onChange({ questions: q });
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-white mt-4 mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">Quiz Builder</div>
        <Button size="sm" variant="outline" onClick={addQuestion} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      {data.questions.length === 0 ? (
        <div className="text-xs text-muted-foreground/80">No questions added yet. Click 'Add Question' to start building your quiz.</div>
      ) : (
        <div className="space-y-6">
          {data.questions.map((q, qIdx) => (
            <div key={qIdx} className="p-3 border rounded-md space-y-3 bg-muted/40 relative">
              <div className="absolute top-3 right-3 text-red-500">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeQuestion(qIdx)} disabled={disabled}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-col md:flex-row gap-3 pr-10">
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-medium">Question {qIdx + 1}</div>
                  <Input 
                    value={q.question} 
                    onChange={e => updateQuestion(qIdx, { question: e.target.value })} 
                    placeholder="Enter question text"
                    disabled={disabled}
                  />
                </div>
                <div className="w-full md:w-24 space-y-1">
                  <div className="text-xs font-medium">Points</div>
                  <Input 
                    type="number" 
                    value={String(q.points)} 
                    onChange={e => updateQuestion(qIdx, { points: Number(e.target.value) })}
                    disabled={disabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium">Options (Select the correct answer)</div>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name={`correct-${qIdx}`} 
                      aria-label="Mark as correct answer"
                      checked={q.correctAnswer === opt && opt !== ''} 
                      onChange={() => updateQuestion(qIdx, { correctAnswer: opt })}
                      disabled={disabled || !opt.trim()}
                      className="mt-0.5"
                    />
                    <Input 
                      className="h-8 flex-1"
                      value={opt} 
                      placeholder={`Option ${oIdx + 1}`}
                      onChange={e => {
                        const newOpts = [...q.options];
                        newOpts[oIdx] = e.target.value;
                        let cAns = q.correctAnswer;
                        if (cAns === opt) { cAns = e.target.value; }
                        updateQuestion(qIdx, { options: newOpts, correctAnswer: cAns });
                      }}
                      disabled={disabled}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const newOpts = q.options.filter((_, i) => i !== oIdx);
                        let cAns = q.correctAnswer;
                        if (cAns === opt) cAns = '';
                        updateQuestion(qIdx, { options: newOpts, correctAnswer: cAns });
                      }}
                      disabled={disabled || q.options.length <= 2}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground/80 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button 
                  size="sm" 
                  variant="link" 
                  className="text-xs h-6 px-0 mt-1 text-blue-600" 
                  onClick={() => updateQuestion(qIdx, { options: [...q.options, ''] })}
                  disabled={disabled}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, any[]>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, { status: ApiAttendanceStatus; remarks: string }>>({});

  // Fetch attendance for a session (teacher)
  async function loadAttendance(sessionId: string) {
    setAttendanceLoading(true);
    try {
      const records = await attendanceApi.getSessionAttendance(sessionId);
      setAttendanceRecords((prev) => ({ ...prev, [sessionId]: records }));
      // Prepare draft for editing
      const draft: Record<string, { status: ApiAttendanceStatus; remarks: string }> = {};
      for (const rec of records) {
        draft[rec.student_id] = { status: rec.status, remarks: rec.remarks || '' };
      }
      setAttendanceDraft(draft);
    } catch (e) {
      toast.error('Failed to load attendance');
    } finally {
      setAttendanceLoading(false);
    }
  }

  // Save attendance for a student (teacher)
  async function saveAttendance(sessionId: string, studentId: string) {
    const draft = attendanceDraft[studentId];
    if (!draft) return;
    setAttendanceLoading(true);
    try {
      await attendanceApi.setAttendance(sessionId, studentId, draft.status, draft.remarks);
      await loadAttendance(sessionId);
      toast.success('Attendance saved');
    } catch (e) {
      toast.error('Failed to save attendance');
    } finally {
      setAttendanceLoading(false);
    }
  }

  // Student: fetch own attendance
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  useEffect(() => {
    if (isStudent) {
      attendanceApi.getMyAttendance().then(setMyAttendance).catch(() => setMyAttendance([]));
    }
  }, [isStudent]);
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<ApiAssignment[]>([]);
  const [courseSessions, setCourseSessions] = useState<ApiClassSession[]>([]);
  const [courseLessons, setCourseLessons] = useState<ApiLesson[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<ApiMaterial[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<ApiEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [availableStudents, setAvailableStudents] = useState<ApiUser[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [gradebook, setGradebook] = useState<ApiCourseGradeRow[]>([]);
  const [myGrade, setMyGrade] = useState<ApiMyCourseGrade | null>(null);
  const [gradeOverrideDrafts, setGradeOverrideDrafts] = useState<Record<string, { finalGrade: string; remarks: string }>>({});

  const [attendanceReport, setAttendanceReport] = useState<any[]>([]);
  const [loadingAttendanceReport, setLoadingAttendanceReport] = useState(false);

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
    status: 'published',
    period: 'prelim',
    weekInPeriod: 1,
    submissionType: 'online_text',
    rubric: [] as Array<{ name: string; weight: number }>,
    quizData: null as { questions: Array<{ question: string; options: string[]; correctAnswer: string; points: number }> } | null,
  });

  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<
    Record<
      string,
      {
        title: string;
        description: string;
        dueAt: string;
        points: number;
        status: string;
        period: string;
        weekInPeriod: number;
        submissionType: string;
        rubric: Array<{ name: string; weight: number }>;
        quizData: { questions: Array<{ question: string; options: string[]; correctAnswer: string; points: number }> } | null;
      }
    >
  >({});

  const [studentQuizDrafts, setStudentQuizDrafts] = useState<Record<string, Record<number, string>>>({});
  const [newMaterial, setNewMaterial] = useState<{ title: string; description: string; file: File | null }>({
    title: '',
    description: '',
    file: null,
  });

  const [openSubmissionsFor, setOpenSubmissionsFor] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [studentSubmissionDrafts, setStudentSubmissionDrafts] = useState<Record<string, string>>({});
  const [studentSubmissionFiles, setStudentSubmissionFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({
    prelim: false,
    midterm: false,
    semifinals: false,
    finals: false,
  });

  const [showLessonComposer, setShowLessonComposer] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<ApiLesson | null>(null);

  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    if (activeTab === 'attendance-report' && isTeacher) {
      loadAttendanceReport();
    }
  }, [activeTab, isTeacher]);


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

  async function loadAvailableStudents() {
    if (availableStudents.length > 0) return;
    setLoadingStudents(true);
    try {
      const res = await api.users({ role: 'student', limit: 1000 });
      setAvailableStudents(res.data);
    } catch (e) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleEnrollStudent() {
    if (!courseId || !selectedStudentId) return;
    setIsEnrolling(true);
    try {
      await api.enrollStudent(courseId, selectedStudentId);
      toast.success('Student enrolled successfully');
      setShowAddStudent(false);
      setSelectedStudentId('');
      void loadEnrollments();
    } catch (e: any) {
      toast.error(e.message || 'Failed to enroll student');
    } finally {
      setIsEnrolling(false);
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

  async function loadAttendanceReport() {
    if (!courseId) return;
    setLoadingAttendanceReport(true);
    try {
      const data = await attendanceApi.getCourseAttendanceReport(courseId);
      setAttendanceReport(data);
    } catch (e) {
      toast.error('Failed to load attendance report');
    } finally {
      setLoadingAttendanceReport(false);
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
      const rubric = newAssignment.rubric
        .filter((row) => row.name.trim())
        .map((row) => ({ name: row.name.trim(), weight: Number(row.weight) || 0 }));

      await api.createCourseAssignment(courseId, {
        title: newAssignment.title.trim(),
        description: newAssignment.description || null,
        due_at: newAssignment.dueAt || null,
        points: Number(newAssignment.points) || 0,
        status: newAssignment.status || 'published',
        period: newAssignment.period,
        week_in_period: newAssignment.weekInPeriod,
        submission_type: newAssignment.submissionType || 'online_text',
        rubric: rubric.length ? rubric : null,
        quiz_data: newAssignment.submissionType === 'quiz' ? newAssignment.quizData : null,
      });
      setNewAssignment({
        title: '',
        description: '',
        dueAt: '',
        points: 100,
        status: 'published',
        period: 'prelim',
        weekInPeriod: 1,
        submissionType: 'online_text',
        rubric: [],
        quizData: null,
      });
      await refreshAssignments();
    } finally {
      setSaving(false);
    }
  }

  function initAssignmentDraft(assignment: ApiAssignment) {
    setAssignmentDrafts((prev) => {
      if (prev[assignment.id]) return prev;
      return {
        ...prev,
        [assignment.id]: {
          title: assignment.title,
          description: assignment.description || '',
          dueAt: assignment.dueDate ? format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
          points: assignment.points ?? 0,
          status: assignment.status || 'published',
          period: normalizePeriod(assignment.period),
          weekInPeriod: normalizeWeek(assignment.weekInPeriod),
          submissionType: assignment.submissionType || 'online_text',
          rubric: Array.isArray(assignment.rubric) ? assignment.rubric : [],
          quizData: assignment.quizData || null,
        }
      };
    });
  }

  async function handleSaveAssignment(assignment: ApiAssignment) {
    if (!courseId) return;
    const draft = assignmentDrafts[assignment.id];
    if (!draft) return;

    const rubric = (draft.rubric || [])
      .filter((row) => row.name.trim())
      .map((row) => ({ name: row.name.trim(), weight: Number(row.weight) || 0 }));

    setSaving(true);
    try {
      await api.updateCourseAssignment(courseId, assignment.id, {
        title: draft.title.trim(),
        description: draft.description || null,
        due_at: draft.dueAt || null,
        points: Number(draft.points) || 0,
        status: draft.status,
        period: draft.period,
        week_in_period: Number(draft.weekInPeriod) || 1,
        submission_type: draft.submissionType,
        rubric: rubric.length ? rubric : null,
        quiz_data: draft.submissionType === 'quiz' ? draft.quizData : null,
      });
      setEditingAssignmentId(null);
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

  async function handleStudentSubmit(assignmentId: string, submissionType?: string) {
    const content = studentSubmissionDrafts[assignmentId] || '';
    const file = studentSubmissionFiles[assignmentId] || null;
    const quizDraft = studentQuizDrafts[assignmentId] || {};
    
    let quizAnswersArray: Array<{ questionIndex: number; answer: string }> | undefined = undefined;
    if (submissionType === 'quiz') {
      quizAnswersArray = Object.entries(quizDraft).map(([index, answer]) => ({
        questionIndex: Number(index),
        answer,
      }));
    }

    setSaving(true);
    try {
      await api.createSubmission(assignmentId, {
        content: submissionType === 'file_upload' || submissionType === 'quiz' ? undefined : content,
        file: submissionType === 'online_text' || submissionType === 'quiz' ? undefined : file,
        quiz_answers: quizAnswersArray,
      });
      if (openSubmissionsFor === assignmentId) {
        const res = await api.assignmentSubmissions(assignmentId);
        setSubmissions(res.data);
      }
      await refreshGrades();
      setStudentSubmissionFiles((prev) => ({ ...prev, [assignmentId]: null }));
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout title="Course Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Course not found</p>
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
      const baseUrl = getApiBaseUrl();
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
      const baseUrl = getApiBaseUrl();
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
                  <p className="text-muted-foreground">{course.code} • {course.section}</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground/80" />
                  <span className="text-muted-foreground">{course.teacher}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground/80" />
                  <span className="text-muted-foreground">{course.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground/80" />
                  <span className="text-muted-foreground">{course.term}</span>
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
            <div className="text-center p-3 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{course.materials}</div>
              <div className="text-sm text-muted-foreground">Materials</div>
            </div>
            <div className="text-center p-3 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{course.assignments}</div>
              <div className="text-sm text-muted-foreground">Assignments</div>
            </div>
            <div className="text-center p-3 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{course.students}</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
            <div className="text-center p-3 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">68%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
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
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          <aside className="lg:sticky lg:top-24">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Course Menu</CardTitle>
                <CardDescription>Navigate this course</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <TabsList className="flex flex-col items-stretch h-auto w-full bg-transparent p-0 gap-1">
                  <TabsTrigger value="lessons" className="w-full justify-start gap-2">
                    <BookOpen className="w-4 h-4" />
                    Lessons
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="w-full justify-start gap-2">
                    <FileText className="w-4 h-4" />
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="w-full justify-start gap-2">
                    <Download className="w-4 h-4" />
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="w-full justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Class Sessions
                  </TabsTrigger>
                  <TabsTrigger value="grades" className="w-full justify-start gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Grades
                  </TabsTrigger>
                  {isTeacher ? (
                    <TabsTrigger value="students" className="w-full justify-start gap-2">
                      <Users className="w-4 h-4" />
                      Students
                    </TabsTrigger>
                  ) : null}
                  {isTeacher && (
                    <TabsTrigger value="attendance-report" className="w-full justify-start gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Attendance Report
                    </TabsTrigger>
                  )}
                </TabsList>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-6">
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
                  <Card className="bg-muted/40" id="lesson-composer">
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
                        <div className="text-xs text-muted-foreground">Docs, PPTX, PDFs, etc. will be uploaded as a lesson file in the selected week.</div>
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

                    const allPeriodItems = [
                      ...periodLessons.map((l) => ({ type: 'lesson' as const, id: l.id, title: l.title, obj: l })),
                      ...periodMaterials.map((m) => ({ type: 'material' as const, id: m.id, title: m.title || m.originalName, obj: m })),
                      ...periodAssessments.map((a) => ({ type: 'assessment' as const, id: a.id, title: a.title, due: a.dueDate, points: a.points, obj: a }))
                    ].sort((a, b) => {
                      const w = normalizeWeek(a.obj.weekInPeriod) - normalizeWeek(b.obj.weekInPeriod);
                      if (w !== 0) return w;
                      return (a.id || '').localeCompare(b.id || '');
                    });

                    return (
                      <Card key={period.key}>
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-64 p-4">
                              <div className="w-full aspect-video rounded-lg bg-muted border flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground/80">{course.code}</div>
                                  <div className="text-lg font-semibold">{period.label}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 p-4 md:pl-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-lg font-semibold">{period.label}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {periodLessons.length} lessons • {periodAssessments.length} assessments • {periodMaterials.length} files
                                  </div>
                                  <div className="mt-3 max-w-md">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="text-muted-foreground">{progressPercent}% curriculum coverage</div>
                                      <div className="text-muted-foreground">{coveredWeeks}/4 weeks</div>
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

                              <div className="flex items-center justify-end mt-3 text-sm font-semibold">
                                {allPeriodItems.length} sections
                              </div>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="border-t">
                              <div className="hidden md:grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 p-4 bg-muted/60 border-b border-border/60 text-foreground text-sm font-bold">
                                <div>Section</div>
                                <div className="text-center">Submitted</div>
                                <div className="text-center">Score</div>
                                <div className="text-center">Due</div>
                                <div className="text-center">Status</div>
                              </div>
                              <div className="divide-y divide-border/60 bg-card text-foreground overflow-hidden rounded-b-lg">
                                {allPeriodItems.length === 0 ? (
                                  <div className="p-6 text-center text-muted-foreground/60">No sections added yet.</div>
                                ) : (
                                  allPeriodItems.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_100px_80px] gap-4 p-4 items-center hover:bg-muted/60 transition-colors">
                                      <div className="flex items-center gap-3 min-w-0">
                                        {item.type === 'lesson' && <FileText className="w-5 h-5 text-blue-500 shrink-0" />}
                                        {item.type === 'material' && <Download className="w-5 h-5 text-muted-foreground/60 shrink-0" />}
                                        {item.type === 'assessment' && <Edit className="w-5 h-5 text-muted-foreground/60 shrink-0" />}
                                        <div 
                                          className={`font-medium truncate ${item.type === 'lesson' || item.type === 'material' ? 'cursor-pointer hover:underline text-blue-600 dark:text-blue-400' : ''}`}
                                          onClick={() => {
                                            if (item.type === 'lesson') {
                                              setViewingLesson(item.obj as ApiLesson);
                                            } else if (item.type === 'material') {
                                              openMaterial(item.obj as ApiMaterial);
                                            }
                                          }}
                                        >
                                          {item.title}
                                        </div>
                                      </div>
                                      <div className="text-center text-sm md:block hidden text-muted-foreground/60">—</div>
                                      <div className="text-center text-sm md:block hidden text-muted-foreground/60">
                                        {item.type === 'assessment' && item.points ? `M` : ''}
                                      </div>
                                      <div className="text-center text-sm md:block hidden text-muted-foreground/60">
                                        {item.type === 'assessment' && item.due ? format(new Date(item.due), 'MMM d') : ''}
                                      </div>
                                      <div className="flex justify-center shrink-0">
                                        {item.type === 'assessment' ? (
                                          <ChevronDown className="w-5 h-5 text-muted-foreground/60 -rotate-90" />
                                        ) : (
                                          <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
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
                  <Card className="bg-muted/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Status</div>
                          <Select value={newAssignment.status} onValueChange={(v) => setNewAssignment((s) => ({ ...s, status: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm font-medium">Submission type</div>
                          <Select value={newAssignment.submissionType} onValueChange={(v) => setNewAssignment((s) => ({ ...s, submissionType: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select submission type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online_text">Text</SelectItem>
                              <SelectItem value="file_upload">File</SelectItem>
                              <SelectItem value="text_and_file">Text + File</SelectItem>
                              <SelectItem value="quiz">Auto-Grading Quiz</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium">Rubric categories (optional)</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setNewAssignment((s) => ({
                                ...s,
                                rubric: [...s.rubric, { name: '', weight: 0 }],
                              }))
                            }
                            disabled={saving}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add category
                          </Button>
                        </div>

                        {newAssignment.rubric.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No rubric categories added.</div>
                        ) : (
                          <div className="space-y-2">
                            {newAssignment.rubric.map((row, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 items-center">
                                <Input
                                  placeholder="Category name"
                                  value={row.name}
                                  onChange={(e) =>
                                    setNewAssignment((s) => ({
                                      ...s,
                                      rubric: s.rubric.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)),
                                    }))
                                  }
                                />
                                <Input
                                  type="number"
                                  placeholder="Weight"
                                  value={String(row.weight)}
                                  onChange={(e) =>
                                    setNewAssignment((s) => ({
                                      ...s,
                                      rubric: s.rubric.map((r, i) => (i === idx ? { ...r, weight: Number(e.target.value) } : r)),
                                    }))
                                  }
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setNewAssignment((s) => ({
                                      ...s,
                                      rubric: s.rubric.filter((_, i) => i !== idx),
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                        {newAssignment.submissionType === 'quiz' && (
                          <QuizBuilder
                            quizData={newAssignment.quizData}
                            onChange={(data) => setNewAssignment(s => ({ ...s, quizData: data }))}
                            disabled={saving}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {activeAssignments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No assessments.</div>
                  ) : (
                    activeAssignments.map((assignment) => (
                      <Card key={assignment.id} className="bg-muted/40">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold">{assignment.title}</div>
                            {assignment.description ? (
                              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                            ) : null}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground/80 mt-2">
                              <div>
                                {normalizePeriod(assignment.period)} • Week {normalizeWeek(assignment.weekInPeriod)}
                              </div>
                              <div>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, h:mm a') : '—'}</div>
                              <div>{assignment.points} points</div>
                              <div>Status: {assignment.status}</div>
                              {assignment.submissionType ? (
                                <div>Type: {assignment.submissionType}</div>
                              ) : null}
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
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    initAssignmentDraft(assignment);
                                    setEditingAssignmentId((prev) => (prev === assignment.id ? null : assignment.id));
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  {editingAssignmentId === assignment.id ? 'Close' : 'Edit'}
                                </Button>
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

                        {isTeacher && editingAssignmentId === assignment.id ? (
                          <div className="pt-3 border-t space-y-3">
                            {(() => {
                              const draft = assignmentDrafts[assignment.id];
                              if (!draft) return null;
                              return (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Status</div>
                                      <Select
                                        value={draft.status}
                                        onValueChange={(v) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, status: v },
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="draft">Draft</SelectItem>
                                          <SelectItem value="published">Published</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Submission type</div>
                                      <Select
                                        value={draft.submissionType}
                                        onValueChange={(v) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, submissionType: v },
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select submission type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="online_text">Text</SelectItem>
                                          <SelectItem value="file_upload">File</SelectItem>
                                          <SelectItem value="text_and_file">Text + File</SelectItem>
                                          <SelectItem value="quiz">Auto-Grading Quiz</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Period</div>
                                      <Select
                                        value={draft.period}
                                        onValueChange={(v) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, period: v },
                                          }))
                                        }
                                      >
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
                                      <Select
                                        value={String(draft.weekInPeriod)}
                                        onValueChange={(v) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, weekInPeriod: Number(v) },
                                          }))
                                        }
                                      >
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
                                      <Input
                                        value={draft.title}
                                        onChange={(e) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, title: e.target.value },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Points</div>
                                      <Input
                                        type="number"
                                        value={String(draft.points)}
                                        onChange={(e) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, points: Number(e.target.value) },
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Due at (optional)</div>
                                      <Input
                                        type="datetime-local"
                                        value={draft.dueAt}
                                        onChange={(e) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, dueAt: e.target.value },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium">Description (optional)</div>
                                      <Input
                                        value={draft.description}
                                        onChange={(e) =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: { ...draft, description: e.target.value },
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-sm font-medium">Rubric categories (optional)</div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setAssignmentDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: {
                                              ...draft,
                                              rubric: [...(draft.rubric || []), { name: '', weight: 0 }],
                                            },
                                          }))
                                        }
                                        disabled={saving}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add category
                                      </Button>
                                    </div>

                                    {(draft.rubric || []).length === 0 ? (
                                      <div className="text-xs text-muted-foreground">No rubric categories added.</div>
                                    ) : (
                                      <div className="space-y-2">
                                        {(draft.rubric || []).map((row, idx) => (
                                          <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 items-center">
                                            <Input
                                              placeholder="Category name"
                                              value={row.name}
                                              onChange={(e) =>
                                                setAssignmentDrafts((prev) => ({
                                                  ...prev,
                                                  [assignment.id]: {
                                                    ...draft,
                                                    rubric: (draft.rubric || []).map((r, i) =>
                                                      i === idx ? { ...r, name: e.target.value } : r
                                                    ),
                                                  },
                                                }))
                                              }
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Weight"
                                              value={String(row.weight)}
                                              onChange={(e) =>
                                                setAssignmentDrafts((prev) => ({
                                                  ...prev,
                                                  [assignment.id]: {
                                                    ...draft,
                                                    rubric: (draft.rubric || []).map((r, i) =>
                                                      i === idx ? { ...r, weight: Number(e.target.value) } : r
                                                    ),
                                                  },
                                                }))
                                              }
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                setAssignmentDrafts((prev) => ({
                                                  ...prev,
                                                  [assignment.id]: {
                                                    ...draft,
                                                    rubric: (draft.rubric || []).filter((_, i) => i !== idx),
                                                  },
                                                }))
                                              }
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {draft.submissionType === 'quiz' && (
                                    <QuizBuilder
                                      quizData={draft.quizData}
                                      onChange={(data) =>
                                        setAssignmentDrafts((prev) => ({
                                          ...prev,
                                          [assignment.id]: {
                                            ...draft,
                                            quizData: data,
                                          },
                                        }))
                                      }
                                      disabled={saving}
                                    />
                                  )}

                                  <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingAssignmentId(null)}
                                      disabled={saving}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => handleSaveAssignment(assignment)}
                                      disabled={saving || !draft.title.trim()}
                                    >
                                      Save Changes
                                    </Button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : null}

                        {isStudent && (
                          <div className="space-y-2 pt-3 border-t">
                            {(assignment.submissionType === 'online_text' || assignment.submissionType === 'text_and_file' || !assignment.submissionType) && (
                              <>
                                <div className="text-sm font-medium">Submit answer (text)</div>
                                <Textarea
                                  value={studentSubmissionDrafts[assignment.id] || ''}
                                  onChange={(e) => setStudentSubmissionDrafts((s) => ({ ...s, [assignment.id]: e.target.value }))}
                                  rows={3}
                                />
                              </>
                            )}
                            {(assignment.submissionType === 'file_upload' || assignment.submissionType === 'text_and_file') && (
                              <>
                                <div className="text-sm font-medium">Upload file (doc, PDF, etc.)</div>
                                <Input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setStudentSubmissionFiles((prev) => ({ ...prev, [assignment.id]: file }));
                                  }}
                                />
                              </>
                            )}

                            {assignment.submissionType === 'quiz' && assignment.quizData?.questions && (
                              <div className="space-y-4">
                                <div className="text-sm font-medium">Take Quiz</div>
                                {assignment.quizData.questions.map((q, qIdx) => (
                                  <div key={qIdx} className="space-y-2 p-3 bg-muted/40 border rounded-md">
                                    <div className="text-sm font-medium">{qIdx + 1}. {q.question} <span className="text-muted-foreground/80 font-normal">({q.points} pts)</span></div>
                                    <div className="space-y-1 pl-4">
                                      {q.options.map((opt, oIdx) => {
                                        if (!opt.trim()) return null;
                                        return (
                                          <label key={oIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`quiz-${assignment.id}-q-${qIdx}`}
                                              value={opt}
                                              checked={studentQuizDrafts[assignment.id]?.[qIdx] === opt}
                                              onChange={() => {
                                                setStudentQuizDrafts(prev => ({
                                                  ...prev,
                                                  [assignment.id]: {
                                                    ...(prev[assignment.id] || {}),
                                                    [qIdx]: opt
                                                  }
                                                }));
                                              }}
                                              className="mt-0.5"
                                            />
                                            <span>{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-end pt-2">
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStudentSubmit(assignment.id, assignment.submissionType)}
                                disabled={saving}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </Button>
                            </div>
                          </div>
                        )}

                        {openSubmissionsFor === assignment.id && (
                          <div className="pt-3 border-t space-y-3">
                            {submissions.length === 0 ? (
                              <div className="text-sm text-muted-foreground">No submissions yet.</div>
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
                                        <div className="text-sm text-muted-foreground">
                                          Status: {s.status}{s.submittedAt ? ` • Submitted ${format(new Date(s.submittedAt), 'MMM d, h:mm a')}` : ''}
                                        </div>
                                        {s.content ? (
                                          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{s.content}</div>
                                        ) : null}
                                        {s.fileUrl ? (
                                          <div className="text-sm text-blue-700 mt-2">
                                            <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                                              {s.originalFileName || 'Download file'}
                                            </a>
                                            {s.fileMimeType ? (
                                              <span className="ml-2 text-xs text-muted-foreground/80">({s.fileMimeType})</span>
                                            ) : null}
                                            {typeof s.fileSizeBytes === 'number' ? (
                                              <span className="ml-2 text-xs text-muted-foreground/80">{(s.fileSizeBytes / 1024).toFixed(1)} KB</span>
                                            ) : null}
                                          </div>
                                        ) : null}
                                        
                                        {Array.isArray(s.quizAnswers) && assignment.quizData?.questions && (
                                          <div className="mt-3 space-y-2">
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quiz Responses:</div>
                                            <div className="grid grid-cols-1 gap-2">
                                              {assignment.quizData.questions.map((q, idx) => {
                                                const stuAnsObj = s.quizAnswers?.find((a: any) => a.questionIndex === idx);
                                                const stuAns = stuAnsObj ? stuAnsObj.answer : null;
                                                const isCorrect = stuAns === q.correctAnswer;
                                                return (
                                                  <div key={idx} className={`p-2 border-l-4 rounded bg-muted/40 flex flex-col gap-1 text-sm ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                                    <div className="font-medium">{idx + 1}. {q.question}</div>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                      <span className="text-muted-foreground font-semibold">Answer:</span>
                                                      <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{stuAns || '(Skipped)'}</span>
                                                      {!isCorrect && (
                                                        <span className="text-muted-foreground/80 text-xs ml-1">(Correct: {q.correctAnswer})</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
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
                  <Card className="bg-muted/40">
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
                  <div className="text-sm text-muted-foreground">No materials.</div>
                ) : (
                  courseMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg hover:bg-muted transition-colors">
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
                          <div className="text-sm text-muted-foreground truncate group-hover:underline">
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
                {courseSessions.map((session) => {
                  // Student attendance status for this session
                  let myStatus: string | null = null;
                  if (isStudent && myAttendance.length > 0) {
                    const rec = myAttendance.find((a) => a.session_id === session.id);
                    myStatus = rec ? rec.status : null;
                  }
                  return (
                    <div key={session.id} className="flex flex-col gap-2 p-4 bg-muted/40 rounded-lg">
                      <div className="flex items-center justify-between">
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
                            <div className="text-sm text-muted-foreground">
                              {session.time} • {session.duration}
                            </div>
                            {session.status === 'completed' && (
                              <div className="text-sm text-green-600 mt-1">
                                Recording available • {session.attendees} attended
                              </div>
                            )}
                          </div>
                        </div>
                        {isTeacher && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAttendanceSessionId(session.id);
                              loadAttendance(session.id);
                            }}
                            disabled={attendanceLoading && attendanceSessionId === session.id}
                          >
                            Mark Attendance
                          </Button>
                        )}
                        {isStudent && myStatus && (
                          <span
                            className={
                              'px-3 py-1 rounded-full text-xs font-semibold ' +
                              (myStatus === 'present'
                                ? 'bg-green-100 text-green-700'
                                : myStatus === 'late'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700')
                            }
                          >
                            {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                          </span>
                        )}
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
                      {/* Teacher attendance panel */}
                      {isTeacher && attendanceSessionId === session.id && (
                        <div className="mt-4 p-4 bg-white border rounded-lg">
                          <div className="font-semibold mb-2">Mark Attendance</div>
                          {attendanceLoading ? (
                            <div className="text-muted-foreground">Loading...</div>
                          ) : attendanceRecords[session.id] && attendanceRecords[session.id].length > 0 ? (
                            <div className="space-y-2">
                              {attendanceRecords[session.id].map((rec) => (
                                <div key={rec.student_id} className="flex items-center gap-3">
                                  <span className="w-40 truncate">{rec.student?.name || rec.student_id}</span>
                                  <select
                                    aria-label="Attendance status"
                                    className="border rounded px-2 py-1"
                                    value={attendanceDraft[rec.student_id]?.status || 'absent'}
                                    onChange={(e) =>
                                      setAttendanceDraft((prev) => ({
                                        ...prev,
                                        [rec.student_id]: {
                                          ...prev[rec.student_id],
                                          status: e.target.value as import('../lib/api').ApiAttendanceStatus,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="present">Present</option>
                                    <option value="late">Late</option>
                                    <option value="absent">Absent</option>
                                  </select>
                                  <input
                                    className="border rounded px-2 py-1 flex-1"
                                    placeholder="Remarks (optional)"
                                    value={attendanceDraft[rec.student_id]?.remarks || ''}
                                    onChange={(e) =>
                                      setAttendanceDraft((prev) => ({
                                        ...prev,
                                        [rec.student_id]: {
                                          ...prev[rec.student_id],
                                          remarks: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => saveAttendance(session.id, rec.student_id)}
                                    disabled={attendanceLoading}
                                  >
                                    Save
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No students found for this session.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    <div className="text-sm text-muted-foreground">No enrolled students.</div>
                  ) : (
                    gradebook.map((row) => {
                      const draft = gradeOverrideDrafts[row.student.id] || {
                        finalGrade: row.finalGrade != null ? String(row.finalGrade) : '',
                        remarks: row.remarks || '',
                      };
                      const final = row.finalGrade ?? row.computedPercent;
                      const finalText = typeof final === 'number' ? `${final.toFixed(2)}%` : '—';
                      return (
                        <div key={row.student.id} className="p-4 bg-muted/40 rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="font-semibold">{row.student.name}</div>
                              <div className="text-sm text-muted-foreground">{row.student.email}</div>
                              <div className="text-sm text-muted-foreground/80 mt-1">
                                Computed: {row.computedPercent != null ? `${row.computedPercent.toFixed(2)}%` : '—'} • Graded: {row.gradedCount}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Final</div>
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
                  <div className="p-4 bg-muted/40 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Grade</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {avgCoursePercent != null ? `${avgCoursePercent.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                    <Progress value={avgCoursePercent ?? 0} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {myGrade?.finalGrade != null ? 'Final grade set by teacher.' : 'Computed from graded submissions.'}
                      {myGrade?.remarks ? ` • ${myGrade.remarks}` : ''}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadEnrollments} disabled={loadingEnrollments}>
                      Refresh
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setShowAddStudent(!showAddStudent); loadAvailableStudents(); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {showAddStudent ? 'Cancel' : 'Add Student'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showAddStudent && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/40 flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Select Student</label>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loadingStudents}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStudents ? "Loading..." : "Choose a student"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStudents.map(u => (
                            <SelectItem key={String(u.id)} value={String(u.id)}>
                              {u.name} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleEnrollStudent} disabled={!selectedStudentId || isEnrolling} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                      {isEnrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                    </Button>
                  </div>
                )}
                {loadingEnrollments ? (
                  <div className="text-sm text-muted-foreground">Loading students...</div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No students enrolled.</div>
                ) : (
                  <div className="space-y-2">
                    {courseEnrollments
                      .slice()
                      .sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''))
                      .map((enrollment) => (
                        <div key={enrollment.id} className="flex items-start justify-between gap-3 bg-muted/40 border rounded-lg p-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{enrollment.student?.name || 'Student'}</div>
                            <div className="text-sm text-muted-foreground truncate">{enrollment.student?.email || '—'}</div>
                            <div className="text-xs text-muted-foreground/80 mt-1">
                              Status: {enrollment.status}
                              {enrollment.enrolledAt ? ` • Enrolled ${format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}` : ''}
                            </div>
                          </div>
                          {isTeacher && enrollment.status !== 'dropped' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 shrink-0"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to remove ${enrollment.student?.name} from this course?`)) return;
                                try {
                                  await api.dropEnrollment(courseId, enrollment.id);
                                  toast.success('Student removed from course');
                                  void loadEnrollments();
                                } catch (e: any) {
                                  toast.error(e.message || 'Failed to remove student');
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isTeacher && (
          <TabsContent value="attendance-report" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance Report</CardTitle>
                    <CardDescription>Overview of student attendance across all sessions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadAttendanceReport} disabled={loadingAttendanceReport}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAttendanceReport ? (
                  <div className="text-center py-8 text-muted-foreground">Loading report...</div>
                ) : attendanceReport.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic">No attendance records found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="p-3 text-left font-semibold">Student</th>
                          <th className="p-3 text-left font-semibold">Session</th>
                          <th className="p-3 text-left font-semibold">Date</th>
                          <th className="p-3 text-left font-semibold">Status</th>
                          <th className="p-3 text-left font-semibold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceReport.map((rec) => (
                          <tr key={rec.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-medium">{rec.student?.name}</td>
                            <td className="p-3">{rec.session?.title}</td>
                            <td className="p-3 text-gray-500">
                              {rec.session?.startsAt || rec.session?.date ? format(new Date(rec.session.startsAt || rec.session.date), 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                rec.status === 'present' ? 'bg-green-100 text-green-700' :
                                rec.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500 italic">{rec.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
          </div>
        </div>
      </Tabs>

      {/* Lesson Viewer Dialog */}
      <Dialog open={!!viewingLesson} onOpenChange={(open) => !open && setViewingLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewingLesson?.title}</DialogTitle>
            {viewingLesson?.description && (
              <DialogDescription className="text-base mt-2">
                {viewingLesson.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {viewingLesson?.duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 p-2 rounded-md w-fit">
                <Clock className="w-4 h-4" />
                <span>Estimated duration: {viewingLesson.duration}</span>
              </div>
            )}
            
            <div className="prose prose-sm dark:prose-invert max-w-none mt-6 pb-6 whitespace-pre-wrap leading-relaxed text-foreground">
              {viewingLesson?.content || <span className="italic text-muted-foreground">No content provided for this lesson.</span>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
