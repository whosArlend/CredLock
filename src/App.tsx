import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastViewport } from '@/components/ui/Toast';
import { router } from '@/app/routes';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToastViewport />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
