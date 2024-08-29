import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetUser } from 'src/actions/user';

import { SplashScreen } from 'src/components/loading-screen';

import { UserEditView } from 'src/sections/user/view';

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

      {userLoading ? <SplashScreen /> : <UserEditView user={user} />}
    </>
  );
}
