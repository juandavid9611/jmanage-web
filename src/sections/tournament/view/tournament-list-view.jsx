import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { useGetTournaments } from 'src/actions/tournament';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TournamentCard } from '../tournament-card';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'finished', label: 'Finalizado' },
];

export function TournamentListView() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { tournaments, tournamentsLoading, tournamentsEmpty } = useGetTournaments(
    statusFilter || undefined
  );

  const handleStatusChange = useCallback((_, newValue) => {
    if (newValue !== null) setStatusFilter(newValue);
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Torneos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => navigate(paths.dashboard.tournament.new)}
          >
            Crear Torneo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          {STATUS_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {tournamentsEmpty && !tournamentsLoading && (
          <EmptyContent
            filled
            title="No hay torneos"
            description="Crea tu primer torneo para comenzar"
            sx={{ py: 10 }}
          />
        )}

        <Box
          gap={3}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </Box>
      </Stack>
    </DashboardContent>
  );
}
