import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminResetPassword from "./pages/AdminResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import AdminUserDetails from "./pages/AdminUserDetails";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MessagesPage from "./pages/Messages";
import Profile from "./pages/Profile";
import VirtualClassroom from "./pages/VirtualClassroom";
import CourseDetails from "./pages/CourseDetails";
import NotificationsPage from "./pages/Notifications";
import NotFound from "./pages/NotFound";

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
    Component: AdminForgotPassword,
  },
  {
    path: "/admin/reset-password",
    Component: AdminResetPassword,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/admin/profile",
    Component: AdminProfile,
  },
  {
    path: "/admin/users/:userId",
    Component: AdminUserDetails,
  },
  {
    path: "/teacher",
    Component: TeacherDashboard,
  },
  {
    path: "/student",
    Component: StudentDashboard,
  },
  {
    path: "/messages",
    Component: MessagesPage,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/classroom/:classId",
    Component: VirtualClassroom,
  },
  {
    path: "/course/:courseId",
    Component: CourseDetails,
  },
  {
    path: "/notifications",
    Component: NotificationsPage,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
