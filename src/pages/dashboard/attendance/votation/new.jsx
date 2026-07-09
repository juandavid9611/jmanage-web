import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { VotationCreateView } from 'src/sections/votation/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = { title: `${t('label_new_vote')} | ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <VotationCreateView />
    </>
  );
}
