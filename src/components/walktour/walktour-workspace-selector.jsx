import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';

// ----------------------------------------------------------------------

export function WalktourWorkspaceSelector({ workspaces, selectedWorkspace, pendingWorkspace, onSelect }) {
  // Use pendingWorkspace for highlight if set, otherwise fall back to selectedWorkspace
  const activeId = pendingWorkspace?.id || selectedWorkspace?.id;

  return (
    <Stack spacing={1} sx={{ maxHeight: 280, overflowY: 'auto', py: 1 }}>
      {workspaces.map((ws) => {
        const isSelected = activeId === ws.id;
        return (
          <ButtonBase
            key={ws.id}
            onClick={() => onSelect(ws)}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              justifyContent: 'flex-start',
              border: (theme) =>
                `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
              bgcolor: (theme) =>
                isSelected ? theme.vars.palette.primary.lighter : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: (theme) =>
                  isSelected
                    ? theme.vars.palette.primary.lighter
                    : theme.vars.palette.action.hover,
              },
            }}
          >
            <Avatar src={ws.logo} alt={ws.name} sx={{ width: 36, height: 36 }} />

            <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
              <Box component="span" sx={{ typography: 'subtitle2', display: 'block' }}>
                {ws.name}
              </Box>
            </Box>

          </ButtonBase>
        );
      })}
    </Stack>
  );
}
