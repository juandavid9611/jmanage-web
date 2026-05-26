import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
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
    ],
  },
];
