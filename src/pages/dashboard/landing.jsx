import { Helmet } from 'react-helmet-async';

import { LandingPage } from 'src/sections/landing/landing-page';

// ----------------------------------------------------------------------

export default function LandingPageView() {
  return (
    <>
      <Helmet>
        <title>SportsManage — Club & Tournament Management</title>
        <meta
          name="description"
          content="The all-in-one platform for sports clubs. Create tournaments, track scores in real time, and manage your entire league."
        />
      </Helmet>
      <LandingPage />
    </>
  );
}
