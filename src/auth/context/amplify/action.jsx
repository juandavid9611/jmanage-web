import {
  signIn as _signIn,
  signUp as _signUp,
  signOut as _signOut,
  confirmSignUp as _confirmSignUp,
  resetPassword as _resetPassword,
  resendSignUpCode as _resendSignUpCode,
  confirmResetPassword as _confirmResetPassword,
} from 'aws-amplify/auth';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ username, password }) => {
  username = username.toLowerCase();
  await _signIn({ username, password });
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ username, password, fullName }) => {
  username = username.toLowerCase();
  const response = await _signUp({
    username,
    password,
    options: { userAttributes: { email: username, name: fullName, 'custom:role': 'user' } },
  });
  return response;
};

/** **************************************
 * Confirm sign up
 *************************************** */
export const confirmSignUp = async ({ username, confirmationCode }) => {
  username = username.toLowerCase();
  await _confirmSignUp({ username, confirmationCode });
};

/** **************************************
 * Resend code sign up
 *************************************** */
export const resendSignUpCode = async ({ username }) => {
  username = username.toLowerCase();
  await _resendSignUpCode({ username });
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  await _signOut();
};

/** **************************************
 * Reset password
 *************************************** */
export const resetPassword = async ({ username }) => {
  username = username.toLowerCase();
  await _resetPassword({ username });
};

/** **************************************
 * Update password
 *************************************** */
export const updatePassword = async ({ username, confirmationCode, newPassword }) => {
  await _confirmResetPassword({ username, confirmationCode, newPassword });
};
