import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionVertical } from 'src/components/nav-section';

import { useAuthContext } from 'src/auth/hooks';

import { NavUpgrade } from '../components/nav-upgrade';

// ----------------------------------------------------------------------

export function NavMobile({ data, open, onClose, slots, sx, ...other }) {
  const pathname = usePathname();

  const { user } = useAuthContext();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          overflow: 'unset',
          bgcolor: 'var(--layout-nav-bg)',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      {slots?.topArea ?? (
        <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
          <Logo />
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSectionVertical
          data={data}
          sx={{ px: 2, flex: '1 1 auto' }}
          slotProps={{
            currentRole: user?.role,
          }}
          {...other}
        />
        <NavUpgrade />
      </Scrollbar>

      {slots?.bottomArea}
    </Drawer>
  );
}