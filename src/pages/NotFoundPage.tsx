import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="items-center">
          <div className="p-3 rounded-full bg-cyber-rose-muted text-cyber-rose mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl">404 — Page Not Found</CardTitle>
          <CardDescription>
            The requested security endpoint or audit record does not exist.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center border-t-0 pt-2">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
              Return to Security Center
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
