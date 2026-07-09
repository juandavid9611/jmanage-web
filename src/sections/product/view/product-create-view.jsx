import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductNewEditForm } from '../product-new-edit-form';

// ----------------------------------------------------------------------

export function ProductCreateView() {
  const { t } = useTranslation();
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_create_a_new_product')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('product'), href: paths.dashboard.product.root },
          { name: t('label_new_product') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductNewEditForm />
    </DashboardContent>
  );
}
