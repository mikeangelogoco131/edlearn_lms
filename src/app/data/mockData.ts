// Mock data for EdLearn platform

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  teacher: string;
  teacherId: string;
  students: number;
  term: string;
  section: string;
  schedule: string;
  status: 'active' | 'completed' | 'upcoming';
  nextClass?: string;
  materials: number;
  assignments: number;
}

export interface ClassSession {
  id: string;
  courseId: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: 'scheduled' | 'live' | 'completed';
  attendees?: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  submitted?: number;
  total?: number;
  status: 'pending' | 'graded' | 'overdue';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  attendance: number;
  gpa: number;
}

export const mockCourses: Course[] = [
  {
    id: 'cs101',
    title: 'Introduction to Computer Science',
    code: 'CS 101',
    description: 'Fundamental concepts of computer science and programming',
    teacher: 'Prof. Sarah Johnson',
    teacherId: '2',
    students: 45,
    term: 'Spring 2026',
    section: 'BSIT-2A',
    schedule: 'Mon, Wed 9:00 AM - 10:30 AM',
    status: 'active',
    nextClass: '2026-02-21T09:00:00',
    materials: 12,
    assignments: 5,
  },
  {
    id: 'math201',
    title: 'Calculus II',
    code: 'MATH 201',
    description: 'Advanced calculus including integration and series',
    teacher: 'Dr. Michael Chen',
    teacherId: '3',
    students: 38,
    term: 'Spring 2026',
    section: 'BSIT-2A',
    schedule: 'Tue, Thu 2:00 PM - 3:30 PM',
    status: 'active',
    nextClass: '2026-02-22T14:00:00',
    materials: 8,
    assignments: 4,
  },
  {
    id: 'eng102',
    title: 'Academic Writing',
    code: 'ENG 102',
    description: 'Advanced composition and research writing',
    teacher: 'Prof. Emily Davis',
    teacherId: '4',
    students: 32,
    term: 'Spring 2026',
    section: 'BSIT-2A',
    schedule: 'Wed, Fri 1:00 PM - 2:30 PM',
    status: 'active',
    nextClass: '2026-02-21T13:00:00',
    materials: 15,
    assignments: 6,
  },
  {
    id: 'cs202',
    title: 'Data Structures & Algorithms',
    code: 'CS 202',
    description: 'Study of fundamental data structures and algorithm design',
    teacher: 'Prof. Sarah Johnson',
    teacherId: '2',
    students: 42,
    term: 'Spring 2026',
    section: 'BSIT-2B',
    schedule: 'Mon, Wed 2:00 PM - 3:30 PM',
    status: 'active',
    nextClass: '2026-02-21T14:00:00',
    materials: 10,
    assignments: 7,
  },
];

export const mockSessions: ClassSession[] = [
  {
    id: 'session1',
    courseId: 'cs101',
    title: 'Introduction to Python Programming',
    date: '2026-02-21',
    time: '09:00 AM',
    duration: '90 min',
    status: 'scheduled',
  },
  {
    id: 'session2',
    courseId: 'cs101',
    title: 'Variables and Data Types',
    date: '2026-02-19',
    time: '09:00 AM',
    duration: '90 min',
    status: 'completed',
    attendees: 43,
  },
  {
    id: 'session3',
    courseId: 'math201',
    title: 'Integration Techniques',
    date: '2026-02-22',
    time: '02:00 PM',
    duration: '90 min',
    status: 'scheduled',
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign1',
    courseId: 'cs101',
    title: 'Python Basics - Variables Exercise',
    description: 'Complete the programming exercises on variables and data types',
    dueDate: '2026-02-25T23:59:00',
    points: 100,
    submitted: 38,
    total: 45,
    status: 'pending',
  },
  {
    id: 'assign2',
    courseId: 'cs101',
    title: 'Control Flow Assignment',
    description: 'Implement conditional statements and loops',
    dueDate: '2026-02-28T23:59:00',
    points: 100,
    status: 'pending',
  },
  {
    id: 'assign3',
    courseId: 'math201',
    title: 'Integration Problem Set',
    description: 'Solve integration problems using various techniques',
    dueDate: '2026-02-26T23:59:00',
    points: 50,
    submitted: 35,
    total: 38,
    status: 'pending',
  },
  {
    id: 'assign4',
    courseId: 'eng102',
    title: 'Research Proposal Draft',
    description: 'Submit first draft of research proposal',
    dueDate: '2026-02-23T23:59:00',
    points: 150,
    submitted: 28,
    total: 32,
    status: 'pending',
  },
];

export const mockStudents: Student[] = [
  {
    id: 's1',
    name: 'Alex Martinez',
    email: 'alex.martinez@university.edu',
    enrolledCourses: ['cs101', 'math201', 'eng102'],
    attendance: 95,
    gpa: 3.8,
  },
  {
    id: 's2',
    name: 'Emma Wilson',
    email: 'emma.wilson@university.edu',
    enrolledCourses: ['cs101', 'math201'],
    attendance: 88,
    gpa: 3.6,
  },
  {
    id: 's3',
    name: 'James Brown',
    email: 'james.brown@university.edu',
    enrolledCourses: ['cs101', 'eng102'],
    attendance: 92,
    gpa: 3.9,
  },
];

export const analyticsData = {
  totalUsers: 1250,
  totalCourses: 48,
  activeSessions: 12,
  weeklyEngagement: [
    { day: 'Mon', hours: 45 },
    { day: 'Tue', hours: 52 },
    { day: 'Wed', hours: 48 },
    { day: 'Thu', hours: 55 },
    { day: 'Fri', hours: 42 },
    { day: 'Sat', hours: 15 },
    { day: 'Sun', hours: 10 },
  ],
  courseEnrollment: [
    { course: 'CS 101', students: 45 },
    { course: 'MATH 201', students: 38 },
    { course: 'ENG 102', students: 32 },
    { course: 'CS 202', students: 42 },
    { course: 'PHYS 101', students: 35 },
  ],
};
