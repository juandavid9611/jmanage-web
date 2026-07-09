import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetProduct } from 'src/actions/product';

import { ProductShopDetailsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = { title: `${t('page_title_product_details')} - ${CONFIG.appName}` };

  const { id = '' } = useParams();

  const { product, productLoading, productError } = useGetProduct(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProductShopDetailsView product={product} loading={productLoading} error={productError} />
    </>
  );
}
