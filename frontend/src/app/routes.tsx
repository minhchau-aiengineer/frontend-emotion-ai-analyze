import { lazy } from 'react';

export const routes = [
  { path: '/',                    element: lazy(() => import('../features/home/pages/HomePage')) },
  { path: '/home',                element: lazy(() => import('../features/home/pages/HomePage')) },
  { path: '/upload',              element: lazy(() => import('../features/upload/pages/UploadPage')) },
  { path: '/dashboard',           element: lazy(() => import('../features/dashboard/pages/Dashboard')) },
  { path: '/audio-sentiment',     element: lazy(() => import('../features/audio-sentiment/pages/AudioSentimentPage')) },
  { path: '/vision-sentiment',    element: lazy(() => import('../features/vision-sentiment/pages/VisionSentimentPage')) },
  { path: '/max-fusion',          element: lazy(() => import('../features/max-fusion-video/pages/MaxFusionPage')) },
  { path: '/log',                 element: lazy(() => import('../features/log/pages/EnhancedLogPage')) },
  { path: '/trash',               element: lazy(() => import('../features/trash/pages/TrashPage')) },
  { path: '/users',               element: lazy(() => import('../features/users/pages/UsersPage')) },
];
