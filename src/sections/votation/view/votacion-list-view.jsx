import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetVotations, deleteVotation as apiDeleteVotation } from 'src/actions/votation';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { periodLabel, playerOfPeriodLabel, lastPlayerOfPeriodLabel } from '../votation-utils';

// ----------------------------------------------------------------------

export function VotacionesListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';
  const { votations, votationsLoading } = useGetVotations(selectedWorkspace?.id);

  const confirmDelete = useBoolean();
  const [votationToDelete, setVotationToDelete] = useState(null);

  const handleDeleteClick = useCallback(
    (e, v) => {
      e.stopPropagation();
      setVotationToDelete(v);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!votationToDelete) return;
    try {
      await apiDeleteVotation(votationToDelete.id, selectedWorkspace?.id);
      toast.success(t('label_votation_deleted'));
    } catch {
      toast.error(t('label_error_deleting_votation'));
    } finally {
      confirmDelete.onFalse();
      setVotationToDelete(null);
    }
  }, [votationToDelete, selectedWorkspace?.id, confirmDelete, t]);

  const handleCardClick = useCallback(
    (v) => {
      navigate(paths.dashboard.votaciones.detail(v.id), {
        state: { periodLabel: periodLabel(v, t) },
      });
    },
    [navigate, t]
  );

  // Last closed votation with a winner (includes tied+resolved via tiebreaker)
  const closedWithWinner = votations
    .filter(
      (v) =>
        (v.status === 'closed' && (v.winner_id || v.winnerId)) ||
        (v.status === 'tied' && v.tiebreaker_winner)
    )
    .sort((a, b) =>
      (b.created_at || b.createdAt || '').localeCompare(a.created_at || a.createdAt || '')
    );
  const lastWinner = closedWithWinner[0] || null;

  const totalOpen = votations.filter((v) => v.status === 'open').length;
  const totalClosed = votations.filter(
    (v) => v.status === 'closed' || (v.status === 'tied' && v.tiebreaker_winner)
  ).length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_votations')}
        links={[{ name: t('label_votations') }]}
        action={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:cup-star-bold" />}
              onClick={() => navigate(paths.dashboard.votaciones.new)}
            >
              {t('label_new_vote')}
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Hero — last winner */}
      {lastWinner && <LastWinnerCard votation={lastWinner} onViewDetails={handleCardClick} />}

      {/* Stats row */}
      {!votationsLoading && votations.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <StatChip label={t('total')} value={votations.length} />
          <StatChip label={t('label_open_plural')} value={totalOpen} color="success" />
          <StatChip label={t('label_closed_plural')} value={totalClosed} color="default" />
        </Stack>
      )}

      {/* List */}
      {!votationsLoading && votations.length === 0 && (
        <EmptyContent
          title={t('label_no_votations')}
          description={isAdmin ? t('label_create_first_votation') : t('label_no_active_votations')}
          sx={{ py: 8 }}
        />
      )}

      {votations.length > 0 && (
        <Stack spacing={1.5}>
          {[...votations]
            .sort((a, b) =>
              (b.created_at || b.createdAt || '').localeCompare(a.created_at || a.createdAt || '')
            )
            .map((v) => (
              <VotationRow
                key={v.id}
                votation={v}
                isAdmin={isAdmin}
                onClick={() => handleCardClick(v)}
                onDelete={(e) => handleDeleteClick(e, v)}
              />
            ))}
        </Stack>
      )}

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('label_delete_votation')}
        content={
          votationToDelete ? (
            <>
              {t('label_delete_votation_of')}{' '}
              <strong>
                {playerOfPeriodLabel(votationToDelete, t)} — {periodLabel(votationToDelete, t)}
              </strong>
              ? {t('label_action_cannot_be_undone')}
            </>
          ) : null
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('delete')}
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function LastWinnerCard({ votation, onViewDetails }) {
  const { t } = useTranslation();
  const winner =
    votation.tiebreaker_winner ||
    (votation.candidates || []).find((c) => c.id === (votation.winner_id || votation.winnerId));
  if (!winner) return null;

  const totalVotes = votation.votes ? Object.keys(votation.votes).length : 0;
  const winnerVotes = votation.votes
    ? Object.values(votation.votes).filter((v) => v === winner.id).length
    : 0;

  return (
    <Card
      sx={{
        mb: 4,
        p: 3,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.04)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.24)}`,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: (theme) => theme.shadows[4] },
      }}
      onClick={() => onViewDetails(votation)}
    >
      <Stack direction="row" alignItems="center" spacing={2.5}>
        <Iconify
          icon="solar:cup-star-bold"
          width={40}
          sx={{ color: 'warning.main', flexShrink: 0 }}
        />

        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            src={winner.avatar_url}
            alt={winner.name}
            sx={{
              width: 56,
              height: 56,
              fontSize: '1.3rem',
              flexShrink: 0,
              border: (theme) => `2px solid ${theme.palette.warning.main}`,
            }}
          >
            {winner.name?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'warning.main', letterSpacing: 1.5, lineHeight: 1 }}
            >
              {lastPlayerOfPeriodLabel(votation, t)} · {periodLabel(votation, t)}
            </Typography>
            <Typography variant="h5" fontWeight={700} noWrap>
              {winner.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {winnerVotes} {t('label_of')} {totalVotes}{' '}
              {totalVotes === 1 ? t('label_vote_singular') : t('label_votes_plural')} ·{' '}
              {winner.training_pct}% {t('word_attendance')}
            </Typography>
          </Box>
        </Stack>

        <Iconify
          icon="eva:arrow-ios-forward-fill"
          width={20}
          sx={{ color: 'text.disabled', flexShrink: 0 }}
        />
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function StatChip({ label, value, color = 'primary' }) {
  return (
    <Card sx={{ px: 2.5, py: 1.5, minWidth: 100 }}>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
      <Label color={color} sx={{ mt: 0.5 }}>
        {label}
      </Label>
    </Card>
  );
}

// ----------------------------------------------------------------------

function VotationRow({ votation, isAdmin, onClick, onDelete }) {
  const { t } = useTranslation();
  const isOpen = votation.status === 'open';
  const isTied = votation.status === 'tied';
  const tiebreakerWinner = votation.tiebreaker_winner || null;
  const tieResolved = isTied && !!tiebreakerWinner;
  const totalVotes = votation.votes ? Object.keys(votation.votes).length : 0;
  const eligibleCandidates = (votation.candidates || []).filter((c) => c.eligible !== false).length;
  const winner = (votation.candidates || []).find(
    (c) => c.id === (votation.winner_id || votation.winnerId)
  );

  return (
    <Card
      onClick={onClick}
      sx={{
        px: 2.5,
        py: 2,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: (theme) => theme.shadows[4] },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Label color={isOpen ? 'success' : isTied && !tieResolved ? 'warning' : 'default'}>
              {t(
                isOpen
                  ? 'label_open_singular'
                  : isTied && !tieResolved
                    ? 'label_match_result_draw'
                    : 'label_closed_singular'
              )}
            </Label>
            {tieResolved && (
              <Label color="warning" sx={{ opacity: 0.6 }}>
                {t('label_tiebreaker')}
              </Label>
            )}
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {playerOfPeriodLabel(votation, t)} — {periodLabel(votation, t)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2.5} flexWrap="wrap">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify
                icon="solar:users-group-rounded-bold"
                width={14}
                sx={{ color: 'text.disabled' }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {eligibleCandidates} {t('label_candidates')}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="solar:cup-star-bold" width={14} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {totalVotes} {totalVotes === 1 ? t('label_vote_singular') : t('label_votes_plural')}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify
                icon="solar:shield-minimalistic-bold"
                width={14}
                sx={{ color: 'text.disabled' }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('label_min_abbr')} {votation.min_pct ?? votation.minPct}%
              </Typography>
            </Stack>
            {(winner || tiebreakerWinner) && !isOpen && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify
                  icon="solar:medal-ribbons-star-bold"
                  width={14}
                  sx={{ color: 'warning.main' }}
                />
                <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {(winner || tiebreakerWinner).name}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {isAdmin && (
            <Tooltip title={t('delete')}>
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
          <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 0.5 }} />
          <Iconify icon="eva:arrow-ios-forward-fill" width={20} sx={{ color: 'text.disabled' }} />
        </Stack>
      </Stack>
    </Card>
  );
}
