import { mutate } from 'swr';
import React, { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { endpoints } from 'src/utils/axios';

import { useGetWorkspaces, updateMyWorkspace, useGetAllWorkspaces } from 'src/actions/workspaces';

import { useAuthContext } from 'src/auth/hooks';

// Create the context
const WorkspaceContext = createContext();

// Create a provider component
export const WorkspaceProvider = ({ children }) => {
  const { authenticated } = useAuthContext();
  const { workspaces, isLoading, error } = useGetWorkspaces(authenticated);
  const { allWorkspaces } = useGetAllWorkspaces(authenticated);
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

  // Local-only switch: updates state + localStorage (used by sidebar popover)
  const handleSetSelectedWorkspace = useCallback((workspace) => {
    setSelectedWorkspace(workspace);
    if (workspace?.id) {
      localStorage.setItem('selectedWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }
  }, []);

  // Membership change: updates state + localStorage + calls API (used by workspace card & walktour)
  const changeWorkspaceMembership = useCallback((workspace) => {
    handleSetSelectedWorkspace(workspace);
    if (workspace?.id) {
      updateMyWorkspace(workspace.id)
        .then(() => {
          mutate(endpoints.workspaces);
          mutate(`${endpoints.workspaces}/all`);
        })
        .catch((err) => {
          console.error('Failed to update workspace membership:', err);
        });
    }
  }, [handleSetSelectedWorkspace]);

  const value = useMemo(
    () => ({
      selectedWorkspace,
      setSelectedWorkspace: handleSetSelectedWorkspace,
      changeWorkspaceMembership,
      workspaces,
      allWorkspaces,
      workspaceRole: selectedWorkspace?.role,
    }),
    [selectedWorkspace, workspaces, allWorkspaces, handleSetSelectedWorkspace, changeWorkspaceMembership]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// Custom hook to use the Workspace context
export const useWorkspace = () => useContext(WorkspaceContext);

