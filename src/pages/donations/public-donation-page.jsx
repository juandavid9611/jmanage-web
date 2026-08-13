import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { languages, fallbackLng } from 'src/locales/config-locales';

import { SplashScreen } from 'src/components/loading-screen';

import { PublicDonationView } from 'src/sections/donation/public-donation-view';

export default function PublicDonationPage() {
  const { language } = useParams();
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage?.split('-')[0] || fallbackLng;
  const requestedLanguage = languages.includes(language) ? language : null;
  const metadata = { title: `${t('donations_campaign_title')} | ${CONFIG.site.name}` };

  useEffect(() => {
    if (requestedLanguage && requestedLanguage !== activeLanguage) {
      i18n.changeLanguage(requestedLanguage);
    }
  }, [activeLanguage, i18n, requestedLanguage]);

  if (!language) {
    return <Navigate to={paths.publicDonations.localized(activeLanguage)} replace />;
  }

  if (!requestedLanguage) {
    return <Navigate to={paths.publicDonations.localized(fallbackLng)} replace />;
  }

  if (activeLanguage !== requestedLanguage) {
    return <SplashScreen />;
  }

  return (
    <>
      <Helmet>
        <html lang={requestedLanguage} />
        <title>{metadata.title}</title>
        <meta name="description" content={t('donations_hero_description')} />
        <meta property="og:title" content={t('donations_campaign_title')} />
        <meta property="og:description" content={t('donations_hero_description')} />
        <link rel="alternate" hrefLang="es" href={paths.publicDonations.localized('es')} />
        <link rel="alternate" hrefLang="en" href={paths.publicDonations.localized('en')} />
      </Helmet>
      <PublicDonationView />
    </>
  );
}
