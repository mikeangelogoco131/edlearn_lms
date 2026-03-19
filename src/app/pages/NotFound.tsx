import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { BookOpen, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
