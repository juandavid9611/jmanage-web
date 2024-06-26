import PropTypes from 'prop-types';
import { Auth } from '@aws-amplify/auth';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import { getUser } from 'src/api/user';
import { AMPLIFY_API } from 'src/config-global';

import { AuthContext } from './auth-context';

// ----------------------------------------------------------------------

// NOTE:
// We only build demo at basic level.
// Customer will need to do some extra handling yourself if you want to extend the logic and other features...

// ----------------------------------------------------------------------

const initialState = {
  user: null,
  loading: true,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

Auth.configure(AMPLIFY_API);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();

      if (currentUser) {
        const myUser = await getUser(currentUser.attributes.sub);
        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...currentUser,
              id: currentUser.attributes.sub,
              displayName: currentUser.attributes.name,
              role: currentUser.attributes['custom:role'] || 'user',
              group: myUser.group,
              myUser,
            },
          },
        });
      } else {
        dispatch({
          type: 'INITIAL',
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'INITIAL',
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (email, password) => {
    const currentUser = await Auth.signIn(email.toLowerCase(), password);
    const myUser = await getUser(currentUser.attributes.sub);

    dispatch({
      type: 'INITIAL',
      payload: {
        user: {
          ...currentUser,
          id: currentUser.attributes.sub,
          displayName: currentUser.attributes.name,
          role: currentUser.attributes['custom:role'] || 'user',
          group: myUser.group,
          myUser,
        },
      },
    });
  }, []);

  // REGISTER
  const register = useCallback(async (email, password, firstName, lastName) => {
    await Auth.signUp({
      username: email,
      password,
      attributes: {
        email,
        given_name: firstName,
        family_name: lastName,
      },
    });
  }, []);

  // CONFIRM REGISTER
  const confirmRegister = useCallback(async (email, code) => {
    await Auth.confirmSignUp(email.toLowerCase(), code);
  }, []);

  // RESEND CODE REGISTER
  const resendCodeRegister = useCallback(async (email) => {
    await Auth.resendSignUp(email.toLowerCase());
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    await Auth.signOut();
    dispatch({
      type: 'LOGOUT',
    });
  }, []);

  // FORGOT PASSWORD
  const forgotPassword = useCallback(async (email) => {
    await Auth.forgotPassword(email.toLowerCase());
  }, []);

  // NEW PASSWORD
  const newPassword = useCallback(async (email, code, password) => {
    await Auth.forgotPasswordSubmit(email.toLowerCase(), code, password);
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'amplify',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      logout,
      register,
      newPassword,
      forgotPassword,
      confirmRegister,
      resendCodeRegister,
    }),
    [
      status,
      state.user,
      //
      login,
      logout,
      register,
      newPassword,
      forgotPassword,
      confirmRegister,
      resendCodeRegister,
    ]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
