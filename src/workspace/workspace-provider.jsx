import React, { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { useGetWorkspaces } from 'src/actions/workspaces';

import { useAuthContext } from 'src/auth/hooks';

// Create the context
const WorkspaceContext = createContext();

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  const { authenticated } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated); // Assuming the hook provides loading and error states
  const [selectedWorkspace, setSelectedWorkspace] = useState(null); // Start with null as default

  // Set selectedWorkspace based on localStorage or default to first workspace
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

  const handleSetSelectedWorkspace = useCallback((workspace) => {
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
      setSelectedWorkspace: handleSetSelectedWorkspace,
      workspaces, // Optionally pass workspaces to components if needed
      workspaceRole: selectedWorkspace?.role,
    }),
    [selectedWorkspace, workspaces, handleSetSelectedWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// Custom hook to use the Workspace context
export const useWorkspace = () => useContext(WorkspaceContext);
