import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetUser } from 'src/actions/user';

import { SplashScreen } from 'src/components/loading-screen';

import { OwnUserEditView } from 'src/sections/user/view/own-user-edit-view';

// ----------------------------------------------------------------------

const metadata = { title: `User edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { user, userLoading } = useGetUser(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {userLoading ? <SplashScreen /> : <OwnUserEditView user={user} />}
    </>
  );
}
