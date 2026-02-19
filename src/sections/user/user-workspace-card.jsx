import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';

import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function UserWorkspaceCard() {
  const { selectedWorkspace, changeWorkspaceMembership, allWorkspaces } = useWorkspace();
  const popover = usePopover();

  const handleSelect = (workspace) => {
    changeWorkspaceMembership(workspace);
    popover.onClose();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Mi Categoría"
        subheader="Selecciona la categoría a la que perteneces"
      />

      <CardContent>
        {selectedWorkspace && (
          <ButtonBase
            onClick={popover.onOpen}
            sx={{
              p: 2,
              width: '100%',
              borderRadius: 1.5,
              bgcolor: 'primary.lighter',
              border: (theme) => `1px solid ${theme.palette.primary.light}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'primary.light',
                opacity: 0.85,
              },
            }}
          >
            <Avatar
              src={selectedWorkspace.logo}
              alt={selectedWorkspace.name}
              sx={{ width: 48, height: 48 }}
            />
            <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
              <Typography variant="subtitle1">{selectedWorkspace.name}</Typography>
            </Box>
            {selectedWorkspace.role && (
              <Label color={selectedWorkspace.role === 'admin' ? 'info' : 'default'}>
                {selectedWorkspace.role}
              </Label>
            )}
            <Iconify icon="eva:chevron-down-fill" width={20} sx={{ color: 'text.secondary' }} />
          </ButtonBase>
        )}

        <Popover
          open={popover.open}
          anchorEl={popover.anchorEl}
          onClose={popover.onClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: { width: popover.anchorEl?.offsetWidth || 320, mt: 0.5 },
            },
          }}
        >
          <MenuList>
            {allWorkspaces.map((ws) => (
              <MenuItem
                key={ws.id}
                selected={ws.id === selectedWorkspace?.id}
                onClick={() => handleSelect(ws)}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                  <Avatar src={ws.logo} alt={ws.name} sx={{ width: 32, height: 32 }} />
                  <Box sx={{ flexGrow: 1 }}>{ws.name}</Box>
                </Stack>
              </MenuItem>
            ))}
          </MenuList>
        </Popover>
      </CardContent>
    </Card>
  );
}
