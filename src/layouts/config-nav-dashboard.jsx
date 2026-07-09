import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
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
  votaciones: icon('ic-job'),
};

// ----------------------------------------------------------------------

export function getNavData(t) {
  return [
    /**
     * Overview
     */
    {
      subheader: 'SportsManage 9.0.1',
      items: [
        {
          title: t('nav_home'),
          path: paths.dashboard.root,
          icon: ICONS.dashboard,
          roles: ['admin', 'user'],
        },
        {
          title: t('calendar'),
          path: paths.dashboard.calendar,
          icon: ICONS.calendar,
          roles: ['admin', 'user'],
          clubOnly: true,
        },
        {
          title: t('payments'),
          path: paths.dashboard.user.invoice.invoiceList,
          icon: ICONS.invoice,
          roles: ['admin', 'user'],
        },
        {
          title: t('nav_documents'),
          path: paths.dashboard.fileManager,
          icon: ICONS.folder,
          roles: ['admin', 'user'],
        },
        {
          title: t('nav_matches'),
          path: paths.dashboard.admin.tour.root,
          icon: ICONS.tour,
          roles: ['admin', 'user'],
          clubOnly: true,
        },
        {
          title: t('analytics'),
          path: paths.dashboard.analytics.overview,
          icon: ICONS.analytics,
          roles: ['admin', 'user'],
          clubOnly: true,
          children: [
            { title: t('nav_performance'), path: paths.dashboard.analytics.overview },
            { title: t('nav_scorers_and_assists'), path: paths.dashboard.analytics.top },
            {
              title: t('metric_late_arrivals'),
              path: paths.dashboard.analytics.lateArrives,
            },
          ],
        },
        {
          title: t('shop'),
          path: paths.dashboard.shop.root,
          icon: ICONS.product,
          roles: ['admin', 'user'],
          clubOnly: true,
        },
        {
          title: t('tournaments'),
          path: paths.dashboard.tournament.root,
          icon: ICONS.tour,
          roles: ['admin', 'user'],
        },
        {
          title: t('nav_getting_started_guide'),
          path: paths.dashboard.guide,
          icon: ICONS.blank,
          roles: ['admin', 'user'],
        },
        {
          title: t('nav_trainings'),
          path: paths.dashboard.attendance.root,
          icon: <Iconify icon="solar:running-round-bold" />,
          roles: ['admin', 'user'],
          clubOnly: true,
        },
        {
          title: t('nav_votes'),
          path: paths.dashboard.votaciones.root,
          icon: ICONS.votaciones,
          roles: ['admin', 'user'],
          clubOnly: true,
        },
      ],
    },
    /**
     * Management
     */
    {
      subheader: t('nav_administration'),
      items: [
        {
          title: t('users'),
          path: paths.dashboard.admin.user.list,
          icon: ICONS.user,
          roles: ['admin'],
        },
        {
          title: t('nav_total_payments'),
          path: paths.dashboard.admin.invoice.root,
          icon: ICONS.invoice,
          roles: ['admin'],
        },
        {
          title: t('nav_products'),
          path: paths.dashboard.product.root,
          icon: ICONS.product,
          roles: ['admin'],
          clubOnly: true,
        },
        {
          title: t('nav_orders'),
          path: paths.dashboard.order.root,
          icon: ICONS.order,
          roles: ['admin'],
          clubOnly: true,
        },
      ],
    },
  ];
}
