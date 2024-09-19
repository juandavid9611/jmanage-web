import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'SportsManage 6.3.2',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard, roles: ['admin', 'user'] },
      {
        title: 'Analytics',
        path: paths.dashboard.analytics.overview,
        icon: ICONS.analytics,
        roles: ['admin', 'user'],
        children: [
          { title: 'Overview', path: paths.dashboard.analytics.overview },
          { title: 'Top', path: paths.dashboard.analytics.top },
          {
            title: 'Late Arrives',
            path: paths.dashboard.analytics.lateArrives,
          },
        ],
      },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Calendar',
        path: paths.dashboard.calendar,
        icon: ICONS.calendar,
        roles: ['admin', 'user'],
      },
      {
        title: 'User',
        path: paths.dashboard.admin.user.list,
        icon: ICONS.user,
        roles: ['admin'],
      },
      {
        title: 'Invoice',
        path: paths.dashboard.admin.invoice.root,
        icon: ICONS.invoice,
        roles: ['admin'],
      },
    ],
  },
  {
    subheader: 'User Management',
    items: [
      {
        title: 'User Invoice',
        path: paths.dashboard.user.invoice.invoiceList,
        icon: ICONS.invoice,
        roles: ['admin', 'user'],
      },
    ],
  },
];
