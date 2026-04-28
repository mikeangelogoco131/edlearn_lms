import { lazy, Suspense } from 'react';
import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

// Lazy-load heavy admin pages to reduce main bundle size
const AdminForgotPassword = lazy(() => import("./pages/AdminForgotPassword"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminUserDetails = lazy(() => import("./pages/AdminUserDetails"));

// Lazy-load teacher/student dashboards
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));

// Lazy-load other pages
const MessagesPage = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const VirtualClassroom = lazy(() => import("./pages/VirtualClassroom"));
const CourseDetails = lazy(() => import("./pages/CourseDetails"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
function LazyLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper to add Suspense to lazy components
function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<LazyLoadingFallback />}>
        <Component />
      </Suspense>
    );
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/forgot-password",
    Component: withSuspense(AdminForgotPassword),
  },
  {
    path: "/admin/reset-password",
    Component: withSuspense(AdminResetPassword),
  },
  {
    path: "/admin",
    Component: withSuspense(AdminDashboard),
  },
  {
    path: "/admin/profile",
    Component: withSuspense(AdminProfile),
  },
  {
    path: "/admin/users/:userId",
    Component: withSuspense(AdminUserDetails),
  },
  {
    path: "/teacher",
    Component: withSuspense(TeacherDashboard),
  },
  {
    path: "/student",
    Component: withSuspense(StudentDashboard),
  },
  {
    path: "/messages",
    Component: withSuspense(MessagesPage),
  },
  {
    path: "/profile",
    Component: withSuspense(Profile),
  },
  {
    path: "/classroom/:classId",
    Component: withSuspense(VirtualClassroom),
  },
  {
    path: "/course/:courseId",
    Component: withSuspense(CourseDetails),
  },
  {
    path: "/notifications",
    Component: withSuspense(NotificationsPage),
  },
  {
    path: "*",
    Component: withSuspense(NotFound),
  },
]);
