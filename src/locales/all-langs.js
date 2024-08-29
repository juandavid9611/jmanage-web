// core (MUI)

// date pickers (MUI)
import { enUS as enUSDate, esES as esESDate } from '@mui/x-date-pickers/locales';
// data grid (MUI)
import { enUS as enUSDataGrid, esES as esESDataGrid } from '@mui/x-data-grid/locales';

// ----------------------------------------------------------------------

export const allLangs = [
  {
    value: 'en',
    label: 'English',
    countryCode: 'GB',
    adapterLocale: 'en',
    numberFormat: { code: 'en-US', currency: 'USD' },
    systemValue: {
      components: { ...enUSDate.components, ...enUSDataGrid.components },
    },
  },
  {
    value: 'es',
    label: 'Español',
    countryCode: 'CO',
    adapterLocale: 'es',
    numberFormat: { code: 'es-ES', currency: 'COP' },
    systemValue: {
      components: { ...esESDate.components, ...esESDataGrid.components },
    },
  },
];

/**
 * Country code:
 * https://flagcdn.com/en/codes.json
 *
 * Number format code:
 * https://gist.github.com/raushankrjha/d1c7e35cf87e69aa8b4208a8171a8416
 */
