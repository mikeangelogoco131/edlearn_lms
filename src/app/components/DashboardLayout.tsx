import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpen, LogOut, User, Bell, Search, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleProfileSettings = () => {
    if (user?.role === 'admin') {
      navigate('/admin/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'teacher':
        return 'bg-blue-100 text-blue-700';
      case 'student':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold">EdLearn</span>
              </Link>

              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses, students..."
                  className="w-96 pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-block w-fit mt-1 capitalize ${getRoleBadgeColor(user?.role || '')}`}>
                        {user?.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleProfileSettings();
                    }}
                    disabled={user?.role !== 'admin'}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
