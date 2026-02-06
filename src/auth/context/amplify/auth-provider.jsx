import { Amplify } from 'aws-amplify';
import { useMemo, useEffect, useCallback } from 'react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

import { useSetState } from 'src/hooks/use-set-state';

import axiosInstance from 'src/utils/axios';

import { CONFIG } from 'src/config-global';
import { getUser } from 'src/actions/user';
import { getMyAccounts } from 'src/actions/accounts';

import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

/**
 * Docs:
 * https://docs.amplify.aws/react/build-a-backend/auth/manage-user-session/
 */

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: CONFIG.amplify.userPoolId,
      userPoolClientId: CONFIG.amplify.userPoolWebClientId,
    },
  },
});

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const authSession = (await fetchAuthSession()).tokens;

      if (authSession) {
        const userAttributes = await fetchUserAttributes();

        const accessToken = authSession.idToken.toString();
        // console.log('Access Token:', authSession.accessToken.toString());
        // console.log('Id Token:', authSession.idToken.toString());
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        const dbUser = await getUser(userAttributes.sub);

        if (!dbUser) {
          setState({ user: null, loading: false });
          delete axiosInstance.defaults.headers.common.Authorization;
          delete axiosInstance.defaults.headers.common['x-account-id'];
          return;
        }

        // Fetch account details (including logos)
        const accountsData = await getMyAccounts();
        
        const accountIds = accountsData.map((account) => account.id);
        
        const accountsRoles = accountsData.reduce((acc, account) => {
          acc[account.id] = account.membership?.role;
          return acc;
        }, {});

        console.log('accountsRoles', accountsRoles);

        const accountsMap = accountsData.reduce((acc, account) => {
          acc[account.id] = account;
          return acc;
        }, {});
        
        const storedAccountId = localStorage.getItem('activeAccountId');
        const defaultAccountId = accountIds[0];
        
        // Validate stored account ID against current memberships
        const isValidStoredAccount = accountIds.includes(storedAccountId);
        const activeAccountId = isValidStoredAccount ? storedAccountId : defaultAccountId;

        if (activeAccountId) {
          axiosInstance.defaults.headers.common['x-account-id'] = activeAccountId;
          localStorage.setItem('activeAccountId', activeAccountId); 
          localStorage.setItem('activeAccountRole', accountsRoles[activeAccountId]);
        } else {
          delete axiosInstance.defaults.headers.common['x-account-id'];
        }

        setState({ 
          user: { 
            ...authSession, 
            ...userAttributes, 
            ...dbUser,
            accountIds,
            accountsRoles,
            accounts: accountsMap,
            activeAccountId 
          }, 
          loading: false 
        });
      } else {
        setState({ user: null, loading: false });
        delete axiosInstance.defaults.headers.common.Authorization;
        delete axiosInstance.defaults.headers.common['x-account-id'];
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    console.log('user', state.user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const switchAccount = useCallback((accountId) => {
    const accountIds = state.user?.accountIds || [];
    const isValidAccount = accountIds.includes(accountId);

    if (isValidAccount) {
      axiosInstance.defaults.headers.common['x-account-id'] = accountId;
      localStorage.setItem('activeAccountId', accountId);
      
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          activeAccountId: accountId
        }
      }));
      
      // Optional: Reload to refresh all data with new account context
      window.location.reload();
    } else {
      console.error(`Cannot switch to account ${accountId}: User is not a member.`);
    }
  }, [state.user?.accountIds, setState]);

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            id: state.user?.sub,
            accessToken: state.user?.accessToken?.toString(),
            displayName: state.user?.name,
            role: state.user?.['custom:role'],
            group: state.user?.group,
            photoURL: state.user?.avatarUrl,
          }
        : null,
      checkUserSession,
      switchAccount,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, switchAccount, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
