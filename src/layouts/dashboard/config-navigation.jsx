import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useTranslate();

  const data = useMemo(
    () => [
      // VITTORIA
      // ----------------------------------------------------------------------
      {
        subheader: t('JManage v3.2.1'),
        items: [
          {
            title: t('app'),
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
            roles: ['admin', 'user'],
          },
          {
            title: t('analytics'),
            // path: '#analytics',
            path: paths.dashboard.general.analytics,
            icon: ICONS.analytics,
            roles: ['admin', 'user'],
          },
          {
            title: t('monthly_players'),
            path: '#monthlyPlayerComingSoon',
            icon: ICONS.dashboard,
            disabled: true,
            roles: ['admin', 'user'],
          },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          {
            title: t('payment_request'),
            path: paths.dashboard.admin.paymentRequest.root,
            icon: ICONS.dashboard,
            roles: ['admin'],
            children: [
              {
                title: t('list'),
                path: paths.dashboard.admin.paymentRequest.root,
                roles: ['admin'],
              },
              {
                title: t('create'),
                path: paths.dashboard.admin.paymentRequest.new,
                roles: ['admin'],
              },
            ],
          },
          {
            title: t('user'),
            path: paths.dashboard.admin.user.list,
            icon: ICONS.user,
            roles: ['admin'],
            children: [
              { title: t('cards'), path: paths.dashboard.admin.user.cards },
              { title: t('list'), path: paths.dashboard.admin.user.list },
              { title: t('create'), path: paths.dashboard.admin.user.new },
            ],
          },
          // CALENDAR
          {
            title: t('calendar'),
            path: paths.dashboard.calendar,
            icon: ICONS.calendar,
          },
        ],
      },
      {
        subheader: t('user management'),
        items: [
          {
            title: t('user_payment_request'),
            path: paths.dashboard.employee.paymentRequest.employeeList,
            icon: ICONS.dashboard,
            roles: ['user', 'admin'],
          },
        ],
      },
    ],
    [t]
  );

  return data;
}
