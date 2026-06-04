import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
  blank: icon('ic-blank'),
  calendar: icon('ic-calendar'),
  invoice: icon('ic-invoice'),
  folder: icon('ic-folder'),
};

// ----------------------------------------------------------------------

export const teamOwnerNavData = [
  {
    subheader: 'Mi torneo',
    items: [
      {
        title: 'Resumen',
        path: paths.dashboard.teamOwner.root,
        icon: ICONS.dashboard,
      },
      {
        title: 'Guia de inicio',
        path: paths.dashboard.guide,
        icon: ICONS.blank,
      },
      {
        title: 'Calendario',
        path: paths.dashboard.calendar,
        icon: ICONS.calendar,
        disabled: true,
      },
      {
        title: 'Pagos',
        path: paths.dashboard.user.invoice.invoiceList,
        icon: ICONS.invoice,
        disabled: true,
      },
      {
        title: 'Documentos',
        path: paths.dashboard.fileManager,
        icon: ICONS.folder,
        disabled: true,
      },
    ],
  },
];
