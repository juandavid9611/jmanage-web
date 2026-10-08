import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Active account's type ('club' | 'tournament'); a missing setting means
// 'club', matching the API's ClubAccountChecker and the nav filtering.
export function useAccountType() {
  const { user } = useAuthContext();
  return user?.accounts?.[user?.activeAccountId]?.settings?.account_type ?? 'club';
}
