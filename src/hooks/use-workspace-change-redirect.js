import { useRef, useState, useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useWorkspace } from 'src/workspace/workspace-provider';

// ----------------------------------------------------------------------

/**
 * Hook to redirect to a specified path when the workspace changes.
 * Useful for edit/detail pages to prevent 403 errors when switching workspaces.
 * 
 * @param {string} redirectPath - Path to redirect to when workspace changes
 * @returns {{ isRedirecting: boolean }} - Object with isRedirecting flag
 * 
 * @example
 * // In an edit view component
 * const listPath = paths.dashboard.admin.invoice.root;
 * const { isRedirecting } = useWorkspaceChangeRedirect(listPath);
 * 
 * // Skip rendering/fetching if redirecting
 * if (isRedirecting) return <SplashScreen />;
 */
export function useWorkspaceChangeRedirect(redirectPath) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();
  const prevWorkspaceRef = useRef(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Skip on initial mount - store the current workspace
    if (prevWorkspaceRef.current === null) {
      prevWorkspaceRef.current = selectedWorkspace?.id;
      return;
    }

    // Check if workspace actually changed
    if (prevWorkspaceRef.current !== selectedWorkspace?.id) {
      prevWorkspaceRef.current = selectedWorkspace?.id;
      setIsRedirecting(true);
      router.push(redirectPath);
    }
  }, [selectedWorkspace?.id, redirectPath, router]);

  return { isRedirecting };
}



