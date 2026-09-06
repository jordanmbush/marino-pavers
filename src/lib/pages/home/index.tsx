import type React from 'react';
import { Helmet } from 'react-helmet';

import { CtaBand } from '@/lib/components/ui/CtaBand';

import { BuiltToLast } from './components/BuiltToLast';
import { FeaturedWork } from './components/FeaturedWork';
import { Hero } from './components/Hero';
import { ProcessSection } from './components/ProcessSection';
import { ServiceArea } from './components/ServiceArea';
import { ServicesGrid } from './components/ServicesGrid';
import { Stats } from './components/Stats';
import { Testimonials } from './components/Testimonials';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>
          Marino Pavers — Phoenix Paver Patios, Driveways &amp; Turf
        </title>
      </Helmet>

      <Hero />
      <Stats />
      <ServicesGrid />
      <BuiltToLast />
      <ProcessSection />
      <FeaturedWork />
      <Testimonials />
      <ServiceArea />
      <CtaBand />
    </>
  );
};

export default Home;
