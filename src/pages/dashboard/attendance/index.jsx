import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AttendanceView } from 'src/sections/attendance/view';

// ----------------------------------------------------------------------

const metadata = { title: `Asistencias | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AttendanceView />
    </>
  );
}
