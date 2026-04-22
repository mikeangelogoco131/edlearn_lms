import { useEffect } from 'react';
import { Link } from 'react-router';
import { Video, BookOpen, BarChart3, Shield, Zap, Globe, ClipboardCheck, Bell, Moon, Sun, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  const heroSlides = [
    {
      src: 'https://images.unsplash.com/photo-1758612214882-03f8a1d7211f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMG9ubGluZSUyMGxlYXJuaW5nJTIwbGFwdG9wfGVufDF8fHx8MTc3MTU4NDcyMHww&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Students learning online',
    },
    {
      src: 'https://images.unsplash.com/photo-1762330917056-e69b34329ddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwY2xhc3Nyb29tJTIwZWR1Y2F0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzE1ODYwNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Virtual classroom session',
    },
    {
      src: 'https://images.unsplash.com/photo-1758270705518-b61b40527e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc3MTUxMDQ1NXww&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Students studying together',
    },
  ] as const;

  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  useEffect(() => {
    if (!heroEmblaApi) return;
    const id = window.setInterval(() => {
      heroEmblaApi.scrollNext();
    }, 4500);
    return () => window.clearInterval(id);
  }, [heroEmblaApi]);

  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      iconClass: 'stat-icon-indigo',
      title: 'Live Class Sessions',
      description: 'Run live sessions with a familiar classroom layout: video tiles, chat, participant list, raise-hand signals, and quick controls.',
      bullets: ['Join from the course schedule', 'In-session chat and participant panel', 'Mute/camera/hand raise controls', 'Built for teacher-led sessions'],
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      iconClass: 'stat-icon-emerald',
      title: 'Courses & Enrollment',
      description: 'Keep everything course-specific in one place: details, roster, sessions, assignments, announcements, and progress.',
      bullets: ['Create courses with codes and schedules', 'Enroll learners and manage rosters', 'Course overview and timeline', 'Central hub for learning artifacts'],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      iconClass: 'stat-icon-violet',
      title: 'Analytics & Insights',
      description: 'Dashboards tailored by role help you monitor engagement, progress, and outcomes without losing the course context.',
      bullets: ['Admin, teacher, and student analytics views', 'Course-level engagement snapshots', 'Performance and completion signals', 'Quick insights for daily decisions'],
    },
    {
      icon: <ClipboardCheck className="w-6 h-6" />,
      iconClass: 'stat-icon-amber',
      title: 'Assignments & Submissions',
      description: 'Create assignments, accept student submissions, and keep grading workflows organized inside each course.',
      bullets: ['Publish assignments with due dates', 'Student submission status tracking', 'Teacher grading and feedback flow', 'Visibility aligned with roles'],
    },
    {
      icon: <Bell className="w-6 h-6" />,
      iconClass: 'stat-icon-cyan',
      title: 'Announcements',
      description: 'Keep learners aligned with course announcements for schedule changes, reminders, and important updates.',
      bullets: ['Post course-level announcements', 'Teachers/admins manage updates', 'Students see timely reminders', 'Supports consistent communication'],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      iconClass: 'stat-icon-rose',
      title: 'Roles & Access',
      description: 'Authentication plus role-based permissions ensure the right users can create courses, manage rosters, grade submissions, and view analytics.',
      bullets: ['Admin, teacher, and student roles', 'Scoped permissions per role', 'Secure authentication flow', 'Protected route enforcement'],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ====== HEADER ====== */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EdLearn</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[['#features', 'Features'], ['#solutions', 'Use Cases'], ['#why', 'Why EdLearn'], ['#get-started', 'Get Started']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-semibold">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="btn-glow-primary text-white font-semibold shadow-none border-0">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-xl border-border/50"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative isolate overflow-hidden pt-20 pb-28">
        {/* Background image */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2000&q=80"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-20"
        />
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(20,184,166,0.06) 100%)' }}
        />
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-40 -right-32 -z-10 w-[600px] h-[600px] rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute -bottom-20 -left-32 -z-10 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)' }}
        />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Text side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold mb-6 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                Modern Learning Management System
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
                The LMS built for{' '}
                <span className="gradient-text">real classrooms</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Create courses, enroll learners, run live class sessions, publish assignments, collect submissions, post announcements, and track performance — all in one unified platform.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link to="/login">
                  <Button size="lg" className="btn-glow-primary text-white font-semibold shadow-none border-0 rounded-xl px-6">
                    Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-6 font-semibold border-border/60 hover:bg-accent"
                >
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {['Role-based access', 'Live virtual classes', 'Analytics & grades'].map(item => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Image carousel */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/20"
                style={{ boxShadow: '0 32px 80px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.12)' }}
              >
                <div className="overflow-hidden" ref={heroEmblaRef}>
                  <div className="flex">
                    {heroSlides.map((slide, idx) => (
                      <div key={slide.src} className="flex-[0_0_100%] min-w-0">
                        <ImageWithFallback
                          src={slide.src}
                          alt={slide.alt}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          className="w-full aspect-[16/10] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Carousel overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1.5">
                  {heroSlides.map((_, i) => (
                    <div key={i} className="w-6 h-1 rounded-full bg-white/60" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-background text-muted-foreground text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Platform Capabilities
            </div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Everything You Need in <span className="gradient-text">One Platform</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for educators, students, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconClass}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SOLUTIONS ====== */}
      <section id="solutions" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Built for <span className="gradient-text">Real LMS Workflows</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Admin operations and classroom workflows stay connected.
            </p>
          </div>

          {/* For Administrators */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 md:order-1">
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/20">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1762330917056-e69b34329ddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwY2xhc3Nyb29tJTIwZWR1Y2F0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzE1ODYwNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Learning management"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-4 dark:bg-violet-950/50 dark:text-violet-300">
                <Shield className="w-3.5 h-3.5" /> For Administrators
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Manage the whole platform with confidence</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Keep the platform organized: users, roles, courses, and high-level analytics.
              </p>
              <ul className="space-y-5">
                {[
                  { title: 'Role-based user management', desc: 'Admin, teacher, and student roles with scoped access' },
                  { title: 'Course oversight', desc: 'Monitor courses, enrollments, and overall engagement' },
                  { title: 'Platform analytics', desc: 'High-level reports to support decisions and planning' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg stat-icon-violet flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* For Teachers & Students */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4 dark:bg-indigo-950/50 dark:text-indigo-300">
                <BookOpen className="w-3.5 h-3.5" /> For Teachers & Students
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">A complete teaching and learning loop</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Schedule sessions, publish assignments, share announcements, and track progress — all inside each course.
              </p>
              <ul className="space-y-5">
                {[
                  { title: 'Live sessions tied to the course', desc: 'Join live classes and keep context with the course timeline' },
                  { title: 'Assignments, submissions, and grading', desc: 'Publish work, submit, grade, and track completion' },
                  { title: 'Announcements and progress visibility', desc: 'Keep everyone aligned and informed across the course' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg stat-icon-indigo flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/20">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758270705518-b61b40527e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc3MTUxMDQ1NXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Students studying together"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHY EDLEARN ====== */}
      <section
        id="why"
        className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #7c3aed 100%)' }}
      >
        <div className="pointer-events-none absolute -top-32 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.6) 0%, transparent 70%)' }}
        />

        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">Why Choose EdLearn?</h2>
            <p className="text-xl text-indigo-100">
              A straightforward LMS that stays close to classroom reality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="w-8 h-8" />, title: 'Simple Yet Powerful', desc: 'Clean dashboards, clear course structure, and fast day-to-day workflows.' },
              { icon: <Globe className="w-8 h-8" />, title: 'All-in-One Platform', desc: 'Courses, sessions, assignments, announcements, and analytics—tied together.' },
              { icon: <BarChart3 className="w-8 h-8" />, title: 'Data-Driven Insights', desc: 'Role-based analytics so everyone sees the right signals.' },
            ].map(item => (
              <div
                key={item.title}
                className="text-center p-8 rounded-2xl border border-white/20 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                <p className="text-indigo-100 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section id="get-started" className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Ready to Transform Your{' '}
              <span className="gradient-text">Learning Environment?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Sign in to access your role-based dashboard and start managing your courses today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/login">
                <Button size="lg" className="btn-glow-primary text-white font-semibold shadow-none border-0 rounded-xl px-8">
                  Sign In Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-semibold border-border/60">
                <a href="#features">Browse Features</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t bg-foreground text-background/70">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                >
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-xl font-bold">EdLearn</span>
              </div>
              <p className="text-sm leading-relaxed opacity-70">
                The complete learning management system for modern education institutions.
              </p>
            </div>

            {[
              {
                title: 'Product',
                links: [['#features', 'Features'], ['#solutions', 'Use Cases'], ['#why', 'Why EdLearn'], ['#get-started', 'Get Started']],
              },
              {
                title: 'Company',
                links: [['#', 'About'], ['#', 'Contact'], ['/login', 'Sign In']],
              },
              {
                title: 'Resources',
                links: [['#', 'Help Center'], ['#', 'System Status']],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([href, label]) => (
                    <li key={label}>
                      <a href={href} className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-50">
            <p>© 2026 EdLearn. All rights reserved.</p>
            <p>Built for modern education</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
