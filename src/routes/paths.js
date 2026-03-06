const MOCK_ID = 'ORDER123456';

// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
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
      tour: {
        root: `${ROOTS.DASHBOARD}/tour`,
        new: `${ROOTS.DASHBOARD}/tour/new`,
        details: (id) => `${ROOTS.DASHBOARD}/tour/${id}`,
        edit: (id) => `${ROOTS.DASHBOARD}/tour/${id}/edit`,
      },
    },
    user: {
      ownEdit: (id) => `${ROOTS.DASHBOARD}/user/${id}/own-edit`,
      invoice: {
        invoiceList: `${ROOTS.DASHBOARD}/invoice/user-list`,
      },
    },
    product: {
      root: `${ROOTS.DASHBOARD}/product`,
      new: `${ROOTS.DASHBOARD}/product/new`,
      checkout: `${ROOTS.DASHBOARD}/product/checkout`,
      details: (id) => `${ROOTS.DASHBOARD}/product/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/product/${id}/edit`,
    },
    shop: {
      root: `${ROOTS.DASHBOARD}/shop`,
      checkout: `${ROOTS.DASHBOARD}/shop/checkout`,
      details: (id) => `${ROOTS.DASHBOARD}/shop/${id}`,
    },
    order: {
      root: `${ROOTS.DASHBOARD}/order`,
      details: (id) => `${ROOTS.DASHBOARD}/order/${id}`,
      demo: {
        details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}`,
      },
    },
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    tournament: {
      root: `${ROOTS.DASHBOARD}/tournament`,
      new: `${ROOTS.DASHBOARD}/tournament/new`,
      details: (id) => `${ROOTS.DASHBOARD}/tournament/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/tournament/${id}/edit`,
      matches: (id) => `${ROOTS.DASHBOARD}/tournament/${id}/matches`,
      matchDetail: (tournamentId, matchId) =>
        `${ROOTS.DASHBOARD}/tournament/${tournamentId}/matches/${matchId}`,
    },
  },
};
