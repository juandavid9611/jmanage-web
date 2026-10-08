import { mutate } from 'swr';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';
import { useGetProducts } from 'src/actions/product';

import { ProductShopView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = { title: `${t('page_title_product_shop')} - ${CONFIG.appName}` };

  const { products, productsLoading, productsError } = useGetProducts();

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProductShopView
        products={products}
        loading={productsLoading}
        error={productsError}
        onRetry={() => mutate(endpoints.products)}
      />
    </>
  );
}
