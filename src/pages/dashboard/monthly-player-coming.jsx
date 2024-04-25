import { Helmet } from 'react-helmet-async';

import MonthlyPlayerComingSoonView from 'src/sections/monthly-player-coming/view';

// ----------------------------------------------------------------------

export default function MonthlyPlayerComingSoonPage() {
  return (
    <>
      <Helmet>
        <title> Monthly Player Coming Soon</title>
      </Helmet>

      <MonthlyPlayerComingSoonView />
    </>
  );
}
