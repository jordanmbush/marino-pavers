import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Page404 from '@/lib/pages/404';

import { routes, privateRoutes } from './routes';

/** Minimal, on-brand fallback while a lazy page chunk loads. */
const PageFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-sand">
    <span className="eyebrow animate-pulse text-basalt/40">Marino Pavers</span>
  </div>
);

const Routings = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {routes.map((routeProps) => (
          <Route {...routeProps} key={routeProps.path as string} />
        ))}
        {privateRoutes.map(({ element, ...privateRouteProps }) => (
          <Route
            element={element}
            {...privateRouteProps}
            key={`privateRoute-${privateRouteProps.path}`}
          />
        ))}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </Suspense>
  );
};

export default Routings;
