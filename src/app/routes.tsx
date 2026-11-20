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
import { BreachesPage } from '@/pages/BreachesPage';
import { BreachIncidentDetailPage } from '@/pages/BreachIncidentDetailPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { RecommendationDetailPage } from '@/pages/RecommendationDetailPage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { ArticleDetailPage } from '@/pages/ArticleDetailPage';
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
      { path: 'breaches', element: <BreachesPage /> },
      { path: 'breaches/:slug', element: <BreachIncidentDetailPage /> },
      { path: 'recommendations', element: <RecommendationsPage /> },
      { path: 'recommendations/:slug', element: <RecommendationDetailPage /> },
      { path: 'articles', element: <ArticlesPage /> },
      { path: 'articles/:slug', element: <ArticleDetailPage /> },
      { path: 'analysis-history', element: <AnalysisHistoryPage /> },
      { path: 'analysis-history/:id', element: <AnalysisDetailPage /> },
      { path: 'breach-history', element: <BreachHistoryPage /> },
      { path: 'breach-history/:id', element: <BreachDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
