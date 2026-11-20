import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Route-based code splitting for minimal initial bundle payload
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const AnalyzerPage = lazy(() => import('@/pages/AnalyzerPage').then((m) => ({ default: m.AnalyzerPage })));
const GeneratorPage = lazy(() => import('@/pages/GeneratorPage').then((m) => ({ default: m.GeneratorPage })));
const BreachCheckerPage = lazy(() => import('@/pages/BreachCheckerPage').then((m) => ({ default: m.BreachCheckerPage })));
const BreachesPage = lazy(() => import('@/pages/BreachesPage').then((m) => ({ default: m.BreachesPage })));
const BreachIncidentDetailPage = lazy(() => import('@/pages/BreachIncidentDetailPage').then((m) => ({ default: m.BreachIncidentDetailPage })));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })));
const RecommendationDetailPage = lazy(() => import('@/pages/RecommendationDetailPage').then((m) => ({ default: m.RecommendationDetailPage })));
const ArticlesPage = lazy(() => import('@/pages/ArticlesPage').then((m) => ({ default: m.ArticlesPage })));
const ArticleDetailPage = lazy(() => import('@/pages/ArticleDetailPage').then((m) => ({ default: m.ArticleDetailPage })));
const AnalysisHistoryPage = lazy(() => import('@/pages/AnalysisHistoryPage').then((m) => ({ default: m.AnalysisHistoryPage })));
const AnalysisDetailPage = lazy(() => import('@/pages/AnalysisDetailPage').then((m) => ({ default: m.AnalysisDetailPage })));
const BreachHistoryPage = lazy(() => import('@/pages/BreachHistoryPage').then((m) => ({ default: m.BreachHistoryPage })));
const BreachDetailPage = lazy(() => import('@/pages/BreachDetailPage').then((m) => ({ default: m.BreachDetailPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

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
