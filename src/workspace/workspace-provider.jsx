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
  const { authenticated } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated);
  const { allWorkspaces } = useGetAllWorkspaces(authenticated);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [previewRole, setPreviewRoleState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PREVIEW_ROLE_KEY);
      return PREVIEWABLE_ROLES.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!isLoading && workspaces.length > 0) {
      const storedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      const storedWorkspace = workspaces.find((w) => w.id === storedWorkspaceId);

      if (storedWorkspace) {
        setSelectedWorkspace(storedWorkspace);
      } else {
        // Selected workspace no longer exists (e.g. deleted): fall back and persist.
        setSelectedWorkspace(workspaces[0]);
        localStorage.setItem('selectedWorkspaceId', workspaces[0].id);
      }
    }
  }, [workspaces, isLoading]);

  const selectWorkspace = useCallback((workspace) => {
    setSelectedWorkspace(workspace);
    if (workspace?.id) {
      localStorage.setItem('selectedWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }
  }, []);

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

