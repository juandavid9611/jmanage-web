import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductNewEditForm } from '../product-new-edit-form';

// ----------------------------------------------------------------------

export function ProductEditView({ product }) {
  const { t } = useTranslation();
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('edit')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('product'), href: paths.dashboard.product.root },
          { name: product?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductNewEditForm currentProduct={product} />
    </DashboardContent>
  );
}
