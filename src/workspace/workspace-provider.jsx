import React, { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { useGetWorkspaces, useGetAllWorkspaces } from 'src/actions/workspaces';

import { useAuthContext } from 'src/auth/hooks';

// Create the context
const WorkspaceContext = createContext();

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  const { authenticated } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated);
  const { allWorkspaces } = useGetAllWorkspaces(authenticated);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    if (!isLoading && workspaces.length > 0) {
      const storedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      const storedWorkspace = workspaces.find((w) => w.id === storedWorkspaceId);

      if (storedWorkspace) {
        setSelectedWorkspace(storedWorkspace);
      } else {
        setSelectedWorkspace(workspaces[0]);
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

  const value = useMemo(
    () => ({
      selectedWorkspace,
      setSelectedWorkspace: selectWorkspace,
      selectWorkspace,
      workspaces,
      allWorkspaces,
      workspaceRole: selectedWorkspace?.role,
    }),
    [selectedWorkspace, workspaces, allWorkspaces, selectWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// Custom hook to use the Workspace context
export const useWorkspace = () => useContext(WorkspaceContext);

