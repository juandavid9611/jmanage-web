// ----------------------------------------------------------------------
const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  // AUTH
  auth: {
    amplify: {
      login: `${ROOTS.AUTH}/amplify/login`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      register: `${ROOTS.AUTH}/amplify/register`,
      newPassword: `${ROOTS.AUTH}/amplify/new-password`,
      forgotPassword: `${ROOTS.AUTH}/amplify/forgot-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      monthlyPlayerComingSoon: `${ROOTS.DASHBOARD}/monthly-player-coming-soon`,
    },
    admin: {
      user: {
        root: `${ROOTS.DASHBOARD}/user`,
        new: `${ROOTS.DASHBOARD}/user/new`,
        list: `${ROOTS.DASHBOARD}/user/list`,
        cards: `${ROOTS.DASHBOARD}/user/cards`,
        edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      },
      paymentRequest: {
        root: `${ROOTS.DASHBOARD}/payment_request`,
        employeeList: `${ROOTS.DASHBOARD}/payment_request/employee-list`,
        new: `${ROOTS.DASHBOARD}/payment_request/new`,
        edit: (id) => `${ROOTS.DASHBOARD}/payment_request/${id}/edit`,
      },
    },
    employee: {
      paymentRequest: {
        employeeList: `${ROOTS.DASHBOARD}/payment_request/employee-list`,
      },
    },
  },
};
