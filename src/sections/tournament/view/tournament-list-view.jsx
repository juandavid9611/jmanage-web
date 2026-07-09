import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

// label values below are i18n keys, resolved via t() at render time.
const STATUS_OPTIONS = [
  { value: '', label: 'label_all' },
  { value: 'draft', label: 'draft' },
  { value: 'active', label: 'active' },
  { value: 'finished', label: 'status_finished' },
];

const STATUS_COLOR = {
  draft: 'default',
  active: 'success',
  finished: 'info',
};

export function TournamentListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { tournaments, countsByStatus, tournamentsLoading, tournamentsEmpty } = useGetTournaments(
    statusFilter || undefined
  );

  const handleStatusChange = useCallback((_, newValue) => {
    setStatusFilter(newValue);
  }, []);

  const getCount = (status) => {
    if (!status) return Object.values(countsByStatus).reduce((a, b) => a + b, 0);
    return countsByStatus[status] || 0;
  };

  const handleDelete = useCallback(() => {
    // SWR will auto-revalidate after deleteTournament mutates the cache
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('tournaments')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('tournaments') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => navigate(paths.dashboard.tournament.new)}
          >
            {t('label_create_tournament')}
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
            label={t(opt.label)}
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
          title={t('label_no_tournaments')}
          description={
            statusFilter
              ? `${t('label_no_tournaments_with_status')} "${t(STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label)}"`
              : t('label_create_first_tournament_hint')
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
