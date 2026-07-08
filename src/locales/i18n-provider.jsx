import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next, I18nextProvider as Provider } from 'react-i18next';

import { i18nOptions, fallbackLng } from './config-locales';

// ----------------------------------------------------------------------

// This app's UI is Spanish-only in practice — many labels are hardcoded Spanish
// with no English counterpart, so switching to 'en' produces a broken mixed-
// language UI. Always init with fallbackLng ('es'), ignoring any 'en' a user
// previously toggled and got cached in localStorage.
i18next
  .use(initReactI18next)
  .use(resourcesToBackend((lang, ns) => import(`./langs/${lang}/${ns}.json`)))
  .init({ ...i18nOptions(fallbackLng) });

// ----------------------------------------------------------------------

export function I18nProvider({ children }) {
  return <Provider i18n={i18next}>{children}</Provider>;
}
