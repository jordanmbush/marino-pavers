import { Helmet } from 'react-helmet';

import { site } from '@/lib/data/site';

const DESCRIPTION =
  'Marino Pavers designs and installs custom paver patios, driveways, pool decks, artificial turf, and outdoor living spaces across greater Phoenix — engineered from the base up for the Arizona desert.';

const Meta = () => {
  return (
    <Helmet>
      <html lang="en" />
      <title>Marino Pavers — Phoenix Paver Patios, Driveways &amp; Turf</title>
      <meta name="description" content={DESCRIPTION} />

      <meta name="application-name" content={site.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={site.name} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#211C17" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta
        property="og:title"
        content="Marino Pavers — Phoenix Paver Patios, Driveways & Turf"
      />
      <meta property="og:description" content={DESCRIPTION} />
      <meta name="twitter:card" content="summary_large_image" />

      <link rel="shortcut icon" href="/assets/favicon.svg" />
    </Helmet>
  );
};

export default Meta;
