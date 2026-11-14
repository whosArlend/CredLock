import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { ToastViewport } from '@/components/ui/Toast';
import { router } from '@/app/routes';

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
      <ToastViewport />
    </ToastProvider>
  );
}

export default App;
