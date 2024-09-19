// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    analytics: {
      overview: `${ROOTS.DASHBOARD}/analytics`,
      top: `${ROOTS.DASHBOARD}/analytics/top`,
      lateArrives: `${ROOTS.DASHBOARD}/analytics/late-arrives`,
    },
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    admin: {
      user: {
        list: `${ROOTS.DASHBOARD}/user`,
        edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      },
      invoice: {
        root: `${ROOTS.DASHBOARD}/invoice`,
        new: `${ROOTS.DASHBOARD}/invoice/new`,
        edit: (id) => `${ROOTS.DASHBOARD}/invoice/${id}/edit`,
      },
    },
    user: {
      ownEdit: (id) => `${ROOTS.DASHBOARD}/user/${id}/own-edit`,
      invoice: {
        invoiceList: `${ROOTS.DASHBOARD}/invoice/user-list`,
      },
    },
  },
};
