import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetUser } from 'src/actions/user';

import { SplashScreen } from 'src/components/loading-screen';

import { OwnUserEditView } from 'src/sections/user/view/own-user-edit-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('page_title_user_edit')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

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
