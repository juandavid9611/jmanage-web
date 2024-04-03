import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useGetUser } from 'src/api/user';

import { useSettingsContext } from 'src/components/settings';
import { SplashScreen } from 'src/components/loading-screen';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import UserNewEditForm from '../user-new-edit-form';

// ----------------------------------------------------------------------

export default function UserEditView({ id }) {
  const settings = useSettingsContext();

  const { user: currentUser, userLoading } = useGetUser(id);

  const { t } = useTranslation();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          {
            name: t('app'),
            href: paths.dashboard.root,
          },
          {
            name: t('user'),
            href: paths.dashboard.admin.user.list,
          },
          { name: currentUser?.name },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      {userLoading ? <SplashScreen /> : <UserNewEditForm currentUser={currentUser} />}
    </Container>
  );
}

UserEditView.propTypes = {
  id: PropTypes.string,
};
