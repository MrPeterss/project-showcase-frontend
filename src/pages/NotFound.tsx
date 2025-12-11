import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoToCourses = () => {
    navigate('/courses');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <AlertCircle className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleGoToCourses}
            className="bg-black hover:bg-gray-800 text-white flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back to Courses</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

