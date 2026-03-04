import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTournaments } from 'src/actions/tournament';

import { Label } from 'src/components/label';
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

const STATUS_COLOR = {
  draft: 'default',
  active: 'success',
  finished: 'info',
};

export function TournamentListView() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  // Load all tournaments for count badges on tabs
  const { tournaments: allTournaments } = useGetTournaments();
  // Load filtered list for the grid
  const { tournaments, tournamentsLoading, tournamentsEmpty } = useGetTournaments(
    statusFilter || undefined
  );

  const handleStatusChange = useCallback((_, newValue) => {
    setStatusFilter(newValue);
  }, []);

  const getCount = (status) => {
    if (!status) return allTournaments.length;
    return allTournaments.filter((t) => t.status === status).length;
  };

  const handleDelete = useCallback(() => {
    // SWR will auto-revalidate after deleteTournament mutates the cache
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

      <Tabs
        value={statusFilter}
        onChange={handleStatusChange}
        sx={{
          mb: { xs: 3, md: 5 },
          px: 2.5,
          boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <Tab
            key={opt.value}
            value={opt.value}
            label={opt.label}
            iconPosition="end"
            icon={
              <Label
                variant={statusFilter === opt.value ? 'filled' : 'soft'}
                color={STATUS_COLOR[opt.value] || 'default'}
              >
                {getCount(opt.value)}
              </Label>
            }
          />
        ))}
      </Tabs>

      {tournamentsEmpty && !tournamentsLoading && (
        <EmptyContent
          filled
          title="No hay torneos"
          description={
            statusFilter
              ? `No hay torneos con estado "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}"`
              : 'Crea tu primer torneo para comenzar'
          }
          sx={{ py: 10 }}
        />
      )}

      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
      >
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} onDelete={handleDelete} />
        ))}
      </Box>
    </DashboardContent>
  );
}
