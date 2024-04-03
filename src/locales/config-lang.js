import merge from 'lodash/merge';
import {
  es as esESAdapter,
  enUS as enUSAdapter,
} from 'date-fns/locale';

// core
import {
  enUS as enUSCore,
  esES as esESCore,
} from '@mui/material/locale';
// data-grid
import {
  esES as esESDataGrid,
  enUS as enUSDataGrid,
} from '@mui/x-data-grid';
// date-pickers
import {
  esES as esESDate,
  enUS as enUSDate,
} from '@mui/x-date-pickers/locales';

// PLEASE REMOVE `LOCAL STORAGE` WHEN YOU CHANGE SETTINGS.
// ----------------------------------------------------------------------

export const allLangs = [
  {
    label: 'Spanish',
    value: 'es',
    systemValue: merge(esESDate, esESDataGrid, esESCore),
    adapterLocale: esESAdapter,
    icon: 'flagpack:co',
  },
  {
    label: 'English',
    value: 'en',
    systemValue: merge(enUSDate, enUSDataGrid, enUSCore),
    adapterLocale: enUSAdapter,
    icon: 'flagpack:gb-nir',
  },
];

export const defaultLang = allLangs[0]; // Spanish

// GET MORE COUNTRY FLAGS
// https://icon-sets.iconify.design/flagpack/
// https://www.dropbox.com/sh/nec1vwswr9lqbh9/AAB9ufC8iccxvtWi3rzZvndLa?dl=0
