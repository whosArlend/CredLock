import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { AnalyzerPage } from '@/pages/AnalyzerPage';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { BreachCheckerPage } from '@/pages/BreachCheckerPage';
import { AnalysisHistoryPage } from '@/pages/AnalysisHistoryPage';
import { AnalysisDetailPage } from '@/pages/AnalysisDetailPage';
import { BreachHistoryPage } from '@/pages/BreachHistoryPage';
import { BreachDetailPage } from '@/pages/BreachDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'analyzer', element: <AnalyzerPage /> },
      { path: 'generator', element: <GeneratorPage /> },
      { path: 'breach-checker', element: <BreachCheckerPage /> },
      { path: 'analysis-history', element: <AnalysisHistoryPage /> },
      { path: 'analysis-history/:id', element: <AnalysisDetailPage /> },
      { path: 'breach-history', element: <BreachHistoryPage /> },
      { path: 'breach-history/:id', element: <BreachDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
