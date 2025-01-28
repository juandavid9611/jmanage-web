import React, { useMemo, useState, useEffect, useContext, createContext } from 'react';

import { useGetWorkspaces } from 'src/actions/workspaces';

import { useAuthContext } from 'src/auth/hooks';

// Create the context
const WorkspaceContext = createContext();

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  const { authenticated } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated); // Assuming the hook provides loading and error states
  const [selectedWorkspace, setSelectedWorkspace] = useState(null); // Start with null as default

  // Set selectedWorkspace after workspaces are fetched
  useEffect(() => {
    if (!isLoading && workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0]); // Set the first workspace as the default
    }
  }, [workspaces, isLoading]); // Only run when workspaces change or when loading is done

  const value = useMemo(
    () => ({
      selectedWorkspace,
      setSelectedWorkspace,
      workspaces, // Optionally pass workspaces to components if needed
    }),
    [selectedWorkspace, setSelectedWorkspace, workspaces]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// Custom hook to use the Workspace context
export const useWorkspace = () => useContext(WorkspaceContext);
