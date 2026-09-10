import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetTrainingSessions } from 'src/actions/training-sessions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'label_all' },
  { value: 'draft', label: 'status_draft' },
  { value: 'sent', label: 'status_sent' },
  { value: 'approved', label: 'status_approved' },
  { value: 'rejected', label: 'status_rejected' },
];

const STATUS_COLOR = {
  draft: 'default',
  sent: 'warning',
  approved: 'success',
  rejected: 'error',
};

export function SessionListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const isReviewer = workspaceRole === 'admin' || workspaceRole === 'team_owner';

  const [statusFilter, setStatusFilter] = useState(isReviewer ? 'sent' : '');

  const { sessions, countsByStatus, sessionsLoading, sessionsEmpty } =
    useGetTrainingSessions(selectedWorkspace);

  const filteredSessions = useMemo(
    () => (statusFilter ? sessions.filter((session) => session.status === statusFilter) : sessions),
    [sessions, statusFilter]
  );

  const handleStatusChange = useCallback((_, newValue) => setStatusFilter(newValue), []);

  const getCount = (status) => {
    if (!status) return Object.values(countsByStatus).reduce((a, b) => a + b, 0);
    return countsByStatus[status] || 0;
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_training_sessions')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_training_sessions') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => navigate(paths.dashboard.trainingSessions.new)}
          >
            {t('label_new_session')}
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

      {sessionsEmpty && !sessionsLoading && (
        <EmptyContent
          filled
          title={t('label_no_sessions')}
          description={t('label_create_first_session_hint')}
          sx={{ py: 10 }}
        />
      )}

      {!sessionsEmpty && !filteredSessions.length && (
        <EmptyContent filled title={t('label_no_sessions')} sx={{ py: 10 }} />
      )}

      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
      >
        {filteredSessions.map((session) => (
          <Card
            key={session.id}
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(paths.dashboard.trainingSessions.details(session.id))}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {session.title}
                </Typography>
                <Label variant="soft" color={STATUS_COLOR[session.status]}>
                  {t(STATUS_OPTIONS.find((o) => o.value === session.status)?.label)}
                </Label>
              </Stack>

              <Stack spacing={0.5} sx={{ color: 'text.secondary', typography: 'body2' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:calendar-bold" width={16} />
                  <span>{session.date ? fDate(session.date) : '-'}</span>
                </Stack>
                {session.teamGroup && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon="mdi:account-group" width={16} />
                    <span>{session.teamGroup}</span>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="mdi:notebook-outline" width={16} />
                  <span>{`${session.exercises?.length || 0} ${t('label_exercises')}`}</span>
                </Stack>
                {session.createdBy?.name && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon="mdi:account" width={16} />
                    <span>{session.createdBy.name}</span>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </DashboardContent>
  );
}
