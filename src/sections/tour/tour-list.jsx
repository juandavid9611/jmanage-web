import { toast } from 'sonner';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { deleteTour } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { TourItem } from './tour-item';

// ----------------------------------------------------------------------

export function TourList({ tours }) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();

  const handleView = useCallback(
    (id) => {
      router.push(paths.dashboard.admin.tour.details(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.admin.tour.edit(id));
    },
    [router]
  );

  const handleDelete = useCallback((id) => {
    deleteTour(id, selectedWorkspace?.id);
    toast.success('Delete success!');
    console.info('DELETE', id);
  }, [selectedWorkspace?.id]);

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      >
        {tours.map((tour) => (
          <TourItem
            key={tour.id}
            tour={tour}
            onView={() => handleView(tour.id)}
            onEdit={() => handleEdit(tour.id)}
            onDelete={() => handleDelete(tour.id)}
          />
        ))}
      </Box>

      {tours.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: { xs: 5, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}
