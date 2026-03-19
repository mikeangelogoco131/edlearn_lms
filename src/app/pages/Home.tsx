import { Link } from 'react-router';
import { Video, BookOpen, BarChart3, Shield, Zap, Globe, ClipboardCheck, Bell, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">EdLearn</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#solutions" className="text-muted-foreground hover:text-foreground">Use Cases</a>
            <a href="#why" className="text-muted-foreground hover:text-foreground">Why EdLearn</a>
            <a href="#get-started" className="text-muted-foreground hover:text-foreground">Get Started</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              A practical LMS for courses, live sessions, and assessments
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create courses, enroll learners, run live class sessions, publish assignments, collect submissions,
              post announcements, and track performance with role-based dashboards.
            </p>
            <div className="flex gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758612214882-03f8a1d7211f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMG9ubGluZSUyMGxlYXJuaW5nJTIwbGFwdG9wfGVufDF8fHx8MTc3MTU4NDcyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Students learning online"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed for educators, students, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Live Class Sessions</h3>
                <p className="text-muted-foreground">
                  Run live sessions with a familiar classroom layout: video tiles, chat, participant list,
                  raise-hand signals, and quick controls.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Join from the course schedule</li>
                  <li>• In-session chat and participant panel</li>
                  <li>• Mute/camera/hand raise controls</li>
                  <li>• Built for teacher-led sessions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Courses & Enrollment</h3>
                <p className="text-muted-foreground">
                  Keep everything course-specific in one place: details, roster, sessions, assignments,
                  announcements, and progress.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Create courses with codes and schedules</li>
                  <li>• Enroll learners and manage rosters</li>
                  <li>• Course overview and timeline</li>
                  <li>• Central hub for learning artifacts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
                <p className="text-muted-foreground">
                  Dashboards tailored by role help you monitor engagement, progress, and outcomes
                  without losing the course context.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Admin, teacher, and student analytics views</li>
                  <li>• Course-level engagement snapshots</li>
                  <li>• Performance and completion signals</li>
                  <li>• Quick insights for daily decisions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardCheck className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Assignments & Submissions</h3>
                <p className="text-muted-foreground">
                  Create assignments, accept student submissions, and keep grading workflows organized
                  inside each course.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Publish assignments with due dates</li>
                  <li>• Student submission status tracking</li>
                  <li>• Teacher grading and feedback flow</li>
                  <li>• Visibility aligned with roles</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Announcements</h3>
                <p className="text-muted-foreground">
                  Keep learners aligned with course announcements for schedule changes, reminders,
                  and important updates.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Post course-level announcements</li>
                  <li>• Teachers/admins manage updates</li>
                  <li>• Students see timely reminders</li>
                  <li>• Supports consistent communication</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Roles & Access</h3>
                <p className="text-muted-foreground">
                  Authentication plus role-based permissions ensure the right users can create courses,
                  manage rosters, grade submissions, and view analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Real LMS Workflows</h2>
            <p className="text-xl text-muted-foreground">
              Admin operations and classroom workflows stay connected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1762330917056-e69b34329ddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwY2xhc3Nyb29tJTIwZWR1Y2F0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzE1ODYwNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Learning management"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold mb-4">For Administrators</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Keep the platform organized: users, roles, courses, and high-level analytics.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Role-based user management</div>
                    <div className="text-muted-foreground">Admin, teacher, and student roles with scoped access</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Course oversight</div>
                    <div className="text-muted-foreground">Monitor courses, enrollments, and overall engagement</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Platform analytics</div>
                    <div className="text-muted-foreground">High-level reports to support decisions and planning</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">For Teachers & Students</h3>
              <p className="text-lg text-muted-foreground mb-6">
                A complete teaching and learning loop inside each course: schedule sessions, publish assignments,
                share announcements, and track progress.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Live sessions tied to the course</div>
                    <div className="text-muted-foreground">Join live classes and keep context with the course timeline</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Assignments, submissions, and grading</div>
                    <div className="text-muted-foreground">Publish work, submit, grade, and track completion</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold">Announcements and progress visibility</div>
                    <div className="text-muted-foreground">Keep everyone aligned and informed across the course</div>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758270705518-b61b40527e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc3MTUxMDQ1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Students studying together"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why EdLearn Section */}
      <section id="why" className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose EdLearn?</h2>
            <p className="text-xl text-blue-100">
              A straightforward LMS that stays close to classroom reality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Simple Yet Powerful</h3>
              <p className="text-blue-100">
                Clean dashboards, clear course structure, and fast day-to-day workflows.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">All-in-One Platform</h3>
              <p className="text-blue-100">
                Courses, sessions, assignments, announcements, and analytics—tied together.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data-Driven Insights</h3>
              <p className="text-blue-100">
                Role-based analytics so everyone sees the right signals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning Environment?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to access your role-based dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </Link>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Browse Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-xl font-semibold">EdLearn</span>
              </div>
              <p className="text-sm">
                The complete learning management system for modern education.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#solutions" className="hover:text-white">Use Cases</a></li>
                <li><a href="#why" className="hover:text-white">Why EdLearn</a></li>
                <li><a href="#get-started" className="hover:text-white">Get Started</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2026 EdLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
