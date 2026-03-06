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
    subheader: 'SportsManage 9.0.1',
    items: [
      {
        title: 'Inicio',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        roles: ['admin', 'user'],
      },
      {
        title: 'Calendario',
        path: paths.dashboard.calendar,
        icon: ICONS.calendar,
        roles: ['admin', 'user'],
      },
      {
        title: 'Pagos',
        path: paths.dashboard.user.invoice.invoiceList,
        icon: ICONS.invoice,
        roles: ['admin', 'user'],
      },
      {
        title: 'Documentos',
        path: paths.dashboard.fileManager,
        icon: ICONS.folder,
        roles: ['admin', 'user'],
      },
      {
        title: 'Partidos',
        path: paths.dashboard.admin.tour.root,
        icon: ICONS.tour,
        roles: ['admin', 'user'],
      },
      {
        title: 'Analitica',
        path: paths.dashboard.analytics.overview,
        icon: ICONS.analytics,
        roles: ['admin', 'user'],
        children: [
          { title: 'Rendimiento', path: paths.dashboard.analytics.overview },
          { title: 'Goleadores y asistencias', path: paths.dashboard.analytics.top },
          {
            title: 'Llegadas Tarde',
            path: paths.dashboard.analytics.lateArrives,
          },
        ],
      },
      {
        title: 'Tienda',
        path: paths.dashboard.shop.root,
        icon: ICONS.product,
        roles: ['admin', 'user'],
      },
      {
        title: 'Torneos',
        path: paths.dashboard.tournament.root,
        icon: ICONS.tour,
        roles: ['admin', 'user'],
      },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Administración',
    items: [
      {
        title: 'Usuarios',
        path: paths.dashboard.admin.user.list,
        icon: ICONS.user,
        roles: ['admin'],
      },
      {
        title: 'Pagos Totales',
        path: paths.dashboard.admin.invoice.root,
        icon: ICONS.invoice,
        roles: ['admin'],
      },
      {
        title: 'Productos',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        roles: ['admin'],
      },
      {
        title: 'Ordenes',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        roles: ['admin'],
      },
    ],
  },
];
