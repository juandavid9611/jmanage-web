import React, { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { useGetWorkspaces, useGetAllWorkspaces } from 'src/actions/workspaces';

import { useAuthContext } from 'src/auth/hooks';

// Create the context
const WorkspaceContext = createContext();

const PREVIEW_ROLE_KEY = 'workspaceRolePreview';
// Roles an admin can preview the app as. Extend here if another role needs a preview later.
const PREVIEWABLE_ROLES = ['coach', 'user'];

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  const { authenticated, user } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated);
  const { allWorkspaces } = useGetAllWorkspaces(authenticated);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  // Scoped per Cognito user: plain `selectedWorkspaceId` lived in one shared localStorage key
  // for the whole origin, so switching accounts in the same browser (e.g. an admin testing a
  // player's login) could leak the previous user's selected category into the next session —
  // the symptom was a user picking their real category and it silently reverting later.
  const storageKey = user?.id ? `selectedWorkspaceId:${user.id}` : null;
  const [previewRole, setPreviewRoleState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PREVIEW_ROLE_KEY);
      return PREVIEWABLE_ROLES.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && storageKey) {
      const storedWorkspaceId = localStorage.getItem(storageKey);
      const storedWorkspace = workspaces.find((w) => w.id === storedWorkspaceId);

      if (storedWorkspace) {
        setSelectedWorkspace(storedWorkspace);
      } else {
        // No (valid) stored choice for this user yet, or it no longer exists (e.g. deleted):
        // fall back and persist.
        setSelectedWorkspace(workspaces[0]);
        localStorage.setItem(storageKey, workspaces[0].id);
      }
    }
  }, [workspaces, isLoading, storageKey]);

  const selectWorkspace = useCallback(
    (workspace) => {
      setSelectedWorkspace(workspace);
      if (!storageKey) return;
      if (workspace?.id) {
        localStorage.setItem(storageKey, workspace.id);
      } else {
        localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

  const realWorkspaceRole = selectedWorkspace?.role;
  const canPreviewRole = realWorkspaceRole === 'admin';

  // A role preview only makes sense for the admin role it was set on; switching to a workspace
  // where the user isn't admin would otherwise silently keep overriding their real role.
  // Guarded on selectedWorkspace being resolved so this doesn't wipe a restored preview while
  // the workspace list is still loading (selectedWorkspace starts out null on every page load).
  useEffect(() => {
    if (selectedWorkspace && !canPreviewRole && previewRole) {
      setPreviewRoleState(null);
      try {
        sessionStorage.removeItem(PREVIEW_ROLE_KEY);
      } catch {
        // ignore
      }
    }
  }, [selectedWorkspace, canPreviewRole, previewRole]);

  const setPreviewRole = useCallback((role) => {
    const next = PREVIEWABLE_ROLES.includes(role) ? role : null;
    setPreviewRoleState(next);
    try {
      if (next) {
        sessionStorage.setItem(PREVIEW_ROLE_KEY, next);
      } else {
        sessionStorage.removeItem(PREVIEW_ROLE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const activePreviewRole = canPreviewRole ? previewRole : null;

  const value = useMemo(
    () => ({
      selectedWorkspace,
      setSelectedWorkspace: selectWorkspace,
      selectWorkspace,
      workspaces,
      allWorkspaces,
      workspaceRole: activePreviewRole || realWorkspaceRole,
      realWorkspaceRole,
      canPreviewRole,
      previewRole: activePreviewRole,
      setPreviewRole,
    }),
    [
      selectedWorkspace,
      workspaces,
      allWorkspaces,
      selectWorkspace,
      activePreviewRole,
      realWorkspaceRole,
      canPreviewRole,
      setPreviewRole,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// Custom hook to use the Workspace context
export const useWorkspace = () => useContext(WorkspaceContext);

