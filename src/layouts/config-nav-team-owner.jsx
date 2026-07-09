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

export function getTeamOwnerNavData(t) {
  return [
    {
      subheader: t('nav_my_tournament'),
      items: [
        {
          title: t('nav_overview'),
          path: paths.dashboard.teamOwner.root,
          icon: ICONS.dashboard,
        },
        {
          title: t('nav_getting_started_guide'),
          path: paths.dashboard.guide,
          icon: ICONS.blank,
        },
        {
          title: t('calendar'),
          path: paths.dashboard.calendar,
          icon: ICONS.calendar,
          disabled: true,
        },
        {
          title: t('payments'),
          path: paths.dashboard.user.invoice.invoiceList,
          icon: ICONS.invoice,
          disabled: true,
        },
        {
          title: t('nav_documents'),
          path: paths.dashboard.fileManager,
          icon: ICONS.folder,
          disabled: true,
        },
      ],
    },
  ];
}
