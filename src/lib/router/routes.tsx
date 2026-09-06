import React from 'react';
import type { PathRouteProps } from 'react-router-dom';

const Home = React.lazy(() => import('@/lib/pages/home'));
const Services = React.lazy(() => import('@/lib/pages/services'));
const Gallery = React.lazy(() => import('@/lib/pages/gallery'));
const About = React.lazy(() => import('@/lib/pages/about'));
const Contact = React.lazy(() => import('@/lib/pages/contact'));

export const routes: Array<PathRouteProps> = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/services',
    element: <Services />,
  },
  {
    path: '/gallery',
    element: <Gallery />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
];

export const privateRoutes: Array<PathRouteProps> = [];
