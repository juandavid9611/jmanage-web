import { mutate } from 'swr';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  resendInvitation,
  revokeInvitation,
  useGetTournamentInvitations,
} from 'src/actions/invitation';
import {
  deleteTeam,
  createGroup,
  deleteGroup,
  useGetPlayers,
  assignTeamToGroup,
  removeTeamFromGroup,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { TeamSetupWizard } from './team-setup-wizard';

// ----------------------------------------------------------------------

const GROUP_COLORS = ['primary', 'info', 'warning', 'error', 'success', 'secondary'];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export function TeamList({ tournamentId, tournament, teams, groups }) {
  const { t } = useTranslation();
  const [wizardMode, setWizardMode] = useState(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSlots, setGroupSlots] = useState(2);
  const [isAssigning, setIsAssigning] = useState(false);

  const { workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';
  const { invitations } = useGetTournamentInvitations(isAdmin ? tournamentId : null);

  const isLocked = tournament?.status === 'active' || tournament?.status === 'finished';
  const totalTeams = tournament?.num_teams || teams.length;
  const inscriptionProgress = totalTeams > 0 ? Math.round((teams.length / totalTeams) * 100) : 0;

  const handleDeleteTeam = useCallback(
    async (teamId) => {
      try {
        await deleteTeam(tournamentId, teamId);
        toast.success(t('label_team_deleted'));
      } catch (error) {
        toast.error(t('label_error_deleting_team'));
      }
    },
    [tournamentId, t]
  );

  const handleCreateGroup = async () => {
    try {
      await createGroup(tournamentId, { name: groupName, advancement_slots: groupSlots });
      setGroupDialog(false);
      setGroupName('');
      setGroupSlots(2);
      toast.success(t('label_group_created'));
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(tournamentId, groupId);
      toast.success(t('label_group_deleted'));
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    }
  };

  const handleAssignTeam = async (teamId, newGroupId) => {
    try {
      const removeOps = (groups || [])
        .filter((g) => g.teams?.some((gt) => gt.team_id === teamId))
        .map((g) => removeTeamFromGroup(tournamentId, g.id, teamId));
      await Promise.all(removeOps);
      if (newGroupId) {
        await assignTeamToGroup(tournamentId, newGroupId, teamId);
      }
      toast.success(t('label_team_assigned'));
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    }
  };

  const handleRandomAssign = async () => {
    if (!groups?.length) {
      toast.error(t('label_create_groups_first'));
      return;
    }
    setIsAssigning(true);
    try {
      const removeOps = groups.flatMap((g) =>
        (g.teams || []).map((gt) => removeTeamFromGroup(tournamentId, g.id, gt.team_id))
      );
      await Promise.all(removeOps);
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const assignOps = shuffled.map((team, idx) => {
        const group = groups[idx % groups.length];
        return assignTeamToGroup(tournamentId, group.id, team.id);
      });
      await Promise.all(assignOps);
      // Single revalidation after all ops complete
      mutate((key) => typeof key === 'string' && key.includes(tournamentId));
      toast.success(`${shuffled.length} ${t('label_teams_assigned_randomly')}`);
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    } finally {
      setIsAssigning(false);
    }
  };

  const hasGroups = groups?.length > 0;
  const showGroups = tournament?.type === 'hybrid' || tournament?.type === 'knockout';

  // ── Wizard mode ──
  if (wizardMode) {
    return (
      <TeamSetupWizard
        tournamentId={tournamentId}
        currentTeam={wizardMode === 'create' ? null : wizardMode}
        groups={groups}
        onComplete={() => setWizardMode(null)}
      />
    );
  }

  return (
    <>
      {/* ── Inscription Progress Header ── */}
      <Card sx={{ px: 2.5, py: 1.5, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:account-group" width={20} sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('label_inscription')}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="baseline" spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {teams.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                /{totalTeams} {t('word_teams_lowercase')}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={inscriptionProgress}
              sx={{
                width: 120,
                height: 4,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  bgcolor: inscriptionProgress >= 100 ? 'success.main' : 'primary.main',
                },
              }}
            />

            <Typography
              variant="caption"
              sx={{
                color: inscriptionProgress >= 100 ? 'success.main' : 'text.secondary',
                fontWeight: 600,
              }}
            >
              {inscriptionProgress}%
            </Typography>
          </Stack>

          {!isLocked && (
            <Button
              variant="soft"
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setWizardMode('create')}
            >
              {t('label_register_team')}
            </Button>
          )}
        </Stack>
      </Card>

      {/* ── Locked banner ── */}
      {isLocked && (
        <Card
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="mdi:lock-outline" sx={{ color: 'warning.dark' }} />
            <Typography variant="body2" color="warning.dark">
              {t('label_tournament_is')}{' '}
              {tournament.status === 'active' ? t('label_active_masc') : t('label_finished_masc')}
              {t('label_tournament_locked_teams_suffix')}
            </Typography>
          </Stack>
        </Card>
      )}

      {/* ── Group Management ── */}
      {showGroups && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:group" width={20} />
              <Typography variant="subtitle1">{t('label_groups')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {hasGroups && (
                <LoadingButton
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:shuffle-variant" />}
                  onClick={handleRandomAssign}
                  loading={isAssigning}
                  disabled={teams.length < 2 || isLocked}
                >
                  {t('label_random_assign')}
                </LoadingButton>
              )}
              <Button
                size="small"
                variant="soft"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => setGroupDialog(true)}
                disabled={isLocked}
              >
                {t('label_add_group')}
              </Button>
            </Stack>
          </Stack>

          {!hasGroups ? (
            <Card
              sx={{
                py: 4,
                textAlign: 'center',
                border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.12)}`,
                boxShadow: 'none',
              }}
            >
              <Iconify icon="mdi:group" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('label_no_groups_create_hint')}
              </Typography>
            </Card>
          ) : (
            <Box
              gap={2}
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: `repeat(${Math.min(groups.length, 4)}, 1fr)`,
              }}
            >
              {groups.map((group, gi) => {
                const groupTeams = teams.filter((team) =>
                  group.teams?.some((gt) => gt.team_id === team.id)
                );

                const accent = GROUP_COLORS[gi % GROUP_COLORS.length];

                return (
                  <Card
                    key={group.id}
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      boxShadow: 'none',
                      border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                    }}
                  >
                    {/* Colored header */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.25,
                        bgcolor: (theme) => alpha(theme.palette[accent].main, 0.06),
                        borderBottom: (theme) =>
                          `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: `${accent}.main`,
                          }}
                        />
                        <Typography variant="subtitle2">{group.name}</Typography>
                        <Chip
                          label={`${t('label_slots')}: ${group.advancement_slots || 2}`}
                          size="small"
                          color={accent}
                          variant="soft"
                          sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                        />
                      </Stack>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGroup(group.id)}
                          sx={{ color: 'text.disabled' }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Team list */}
                    <Stack sx={{ px: 2, py: 1.5 }}>
                      {groupTeams.length === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ py: 1, textAlign: 'center' }}
                        >
                          {t('label_drag_teams_here')}
                        </Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {groupTeams.map((team) => (
                            <Stack key={team.id} direction="row" alignItems="center" spacing={1.5}>
                              <Avatar
                                src={team.logo_url || undefined}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  bgcolor: team.primary_color || `${accent}.main`,
                                  color: 'common.white',
                                }}
                              >
                                {!team.logo_url &&
                                  (team.short_name || team.name?.slice(0, 2))?.toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }} noWrap>
                                {team.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                {team.short_name || ''}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          )}
        </Card>
      )}

      {/* ── Team Cards Grid ── */}
      {teams.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.16)}`,
            boxShadow: 'none',
          }}
        >
          <Iconify
            icon="mdi:shield-plus-outline"
            width={56}
            sx={{ color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('label_no_teams_registered')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('label_start_registering_first_team')}
          </Typography>
          {!isLocked && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setWizardMode('create')}
            >
              {t('label_register_first_team')}
            </Button>
          )}
        </Card>
      ) : (
        <Box
          gap={2}
          display="grid"
          gridTemplateColumns={{
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
        >
          {teams.map((team) => (
            <TeamOverviewCard
              key={team.id}
              team={team}
              tournamentId={tournamentId}
              groups={groups}
              isLocked={isLocked}
              isAdmin={isAdmin}
              invitation={invitations?.find((inv) => inv.tournament_team_id === team.id) ?? null}
              onEdit={() => setWizardMode(team)}
              onDelete={() => handleDeleteTeam(team.id)}
              onAssignGroup={handleAssignTeam}
            />
          ))}
        </Box>
      )}

      {/* Create Group Dialog */}
      <Dialog open={groupDialog} onClose={() => setGroupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="mdi:group" width={24} sx={{ color: 'primary.main' }} />
            <span>{t('label_new_group')}</span>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('label_organize_teams_in_groups_hint')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('label_group_name')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('label_group_a_example')}
              autoFocus
              InputProps={{
                startAdornment: (
                  <Iconify
                    icon="mdi:label-outline"
                    width={20}
                    sx={{ mr: 1, color: 'text.disabled' }}
                  />
                ),
              }}
            />
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}
              >
                {t('label_classification_slots_hint')}
              </Typography>
              <Stack direction="row" spacing={1}>
                {[1, 2, 3, 4].map((n) => (
                  <Card
                    key={n}
                    onClick={() => setGroupSlots(n)}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor:
                        groupSlots === n
                          ? 'primary.main'
                          : (theme) => alpha(theme.palette.grey[500], 0.16),
                      bgcolor:
                        groupSlots === n
                          ? (theme) => alpha(theme.palette.primary.main, 0.08)
                          : 'transparent',
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                      },
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: groupSlots === n ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {n}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {n > 1 ? t('word_teams_lowercase') : t('word_team_lowercase')}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setGroupDialog(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('label_create_group')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ======================================================================
// INVITATION BADGE
// ======================================================================

// label values below are i18n keys, resolved via t() at render time.
const INVITATION_BADGE_CONFIG = {
  pending: { label: 'pending', color: 'warning' },
  accepted: { label: 'label_invitation_accepted', color: 'success' },
  expired: { label: 'label_invitation_expired', color: 'default' },
  revoked: { label: 'label_invitation_revoked', color: 'error' },
};

function InvitationBadge({ invitation }) {
  const { t } = useTranslation();
  if (!invitation) return null;
  const cfg = INVITATION_BADGE_CONFIG[invitation.status];
  if (!cfg) return null;
  return (
    <Chip
      label={t(cfg.label)}
      size="small"
      color={cfg.color}
      variant="soft"
      sx={{ height: 16, fontSize: 10, fontWeight: 700, px: 0.5 }}
    />
  );
}

// ======================================================================
// TEAM OVERVIEW CARD
// ======================================================================

function TeamOverviewCard({
  team,
  tournamentId,
  groups,
  isLocked,
  isAdmin,
  invitation,
  onEdit,
  onDelete,
  onAssignGroup,
}) {
  const { t } = useTranslation();
  const { players = [] } = useGetPlayers(tournamentId, team.id);

  // ── Invitation actions menu ──
  const popover = usePopover();
  const [invLoading, setInvLoading] = useState(false);

  const handleResend = useCallback(
    async (e) => {
      e.stopPropagation();
      popover.onClose();
      setInvLoading(true);
      try {
        await resendInvitation({ tournamentId, teamId: team.id });
        toast.success(t('label_invitation_resent'));
      } catch (err) {
        toast.error(err?.message || t('label_error_resending_invitation'));
      } finally {
        setInvLoading(false);
      }
    },
    [tournamentId, team.id, popover, t]
  );

  const handleRevoke = useCallback(
    async (e) => {
      e.stopPropagation();
      popover.onClose();
      setInvLoading(true);
      try {
        await revokeInvitation({ tournamentId, teamId: team.id });
        toast.success(t('label_invitation_revoked_success'));
      } catch (err) {
        toast.error(err?.message || t('label_error_revoking_invitation'));
      } finally {
        setInvLoading(false);
      }
    },
    [tournamentId, team.id, popover, t]
  );

  const currentGroupId =
    groups?.find((g) => g.teams?.some((gt) => gt.team_id === team.id))?.id || '';
  const currentGroup = groups?.find((g) => g.id === currentGroupId);
  const initials = team.short_name || team.name?.slice(0, 2)?.toUpperCase() || '?';

  // Count total uploaded documents across all types
  const totalDocs = Object.values(team.documents || {}).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  // Setup steps with completion status
  const setupSteps = [
    {
      key: 'identity',
      label: t('label_identity'),
      icon: 'mdi:shield-check-outline',
      done: !!team.name && !!team.short_name,
      detail: team.short_name ? `${team.name} (${team.short_name})` : team.name || t('pending'),
    },
    {
      key: 'roster',
      label: t('label_squad'),
      icon: 'mdi:account-group-outline',
      done: players.length >= 30,
      detail: `${players.length}/30 ${t('word_players_lowercase')}`,
    },
    {
      key: 'documents',
      label: t('label_documents'),
      icon: 'mdi:file-document-outline',
      done: totalDocs > 0,
      detail:
        totalDocs > 0
          ? `${totalDocs} ${totalDocs !== 1 ? t('label_files_plural') : t('label_file_singular')}`
          : t('pending'),
    },
    {
      key: 'rules',
      label: t('label_rules'),
      icon: 'mdi:gavel',
      done: !!team.rules_accepted,
      detail: team.rules_accepted ? t('label_accepted') : t('label_not_accepted'),
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;
  const totalSteps = setupSteps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Card
      sx={{
        p: 0,
        overflow: 'hidden',
        cursor: isLocked ? 'default' : 'pointer',
        transition: 'all 0.2s',
        '&:hover': isLocked
          ? {}
          : {
              boxShadow: (theme) => theme.shadows[8],
              transform: 'translateY(-2px)',
            },
      }}
      onClick={isLocked ? undefined : onEdit}
    >
      {/* Colored top bar */}
      <Box sx={{ height: 3, bgcolor: progressPercent === 100 ? 'success.main' : 'warning.main' }} />

      <Stack sx={{ p: 2 }}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar
            src={team.logo_url || undefined}
            sx={{
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: team.primary_color || 'primary.main',
              color: 'common.white',
            }}
          >
            {!team.logo_url && initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {team.name}
              </Typography>
              {currentGroup && (
                <Chip
                  label={currentGroup.name}
                  size="small"
                  color="primary"
                  variant="soft"
                  sx={{ height: 18, fontSize: 10 }}
                />
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {team.contact_email || team.manager_email || ''}
              </Typography>
              {isAdmin && <InvitationBadge invitation={invitation} />}
            </Stack>
          </Box>

          {/* Actions */}
          {!isLocked && (
            <Stack direction="row" spacing={0.25}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Iconify icon="solar:pen-bold" width={14} />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={14} />
              </IconButton>
              {isAdmin && team.contact_email && (
                <IconButton
                  size="small"
                  disabled={invLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    popover.onOpen(e);
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <Iconify icon="eva:more-vertical-fill" width={14} />
                </IconButton>
              )}
            </Stack>
          )}

          {/* Invitation actions menu */}
          <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
            <MenuItem onClick={handleResend} sx={{ fontSize: 13 }}>
              <Iconify icon="mdi:email-sync-outline" width={16} sx={{ mr: 1 }} />
              {t('label_resend_invitation')}
            </MenuItem>
            {invitation && invitation.status !== 'revoked' && (
              <MenuItem onClick={handleRevoke} sx={{ fontSize: 13, color: 'error.main' }}>
                <Iconify icon="mdi:email-remove-outline" width={16} sx={{ mr: 1 }} />
                {t('label_revoke_invitation')}
              </MenuItem>
            )}
          </CustomPopover>
        </Stack>

        {/* Progress summary */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                width: 60,
                height: 4,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  bgcolor: progressPercent === 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: progressPercent === 100 ? 'success.main' : 'text.secondary',
              fontWeight: 600,
            }}
          >
            {completedSteps}/{totalSteps} {t('label_steps')}
          </Typography>
        </Stack>

        {/* Step checklist */}
        <Stack spacing={0.5}>
          {setupSteps.map((step) => (
            <Stack key={step.key} direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: step.done
                    ? (theme) => alpha(theme.palette.success.main, 0.12)
                    : (theme) => alpha(theme.palette.grey[500], 0.08),
                  flexShrink: 0,
                }}
              >
                <Iconify
                  icon={step.done ? 'eva:checkmark-fill' : step.icon}
                  width={step.done ? 12 : 11}
                  sx={{ color: step.done ? 'success.main' : 'text.disabled' }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  fontWeight: step.done ? 500 : 400,
                  color: step.done ? 'text.primary' : 'text.secondary',
                }}
              >
                {step.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: step.done ? 'success.main' : 'text.disabled', fontSize: 10 }}
              >
                {step.detail}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {/* Group assignment */}
        {groups?.length > 0 && !isLocked && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <TextField
              select
              size="small"
              fullWidth
              label={t('label_group')}
              value={currentGroupId}
              onChange={(e) => {
                e.stopPropagation();
                onAssignGroup(team.id, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
            >
              <MenuItem value="">{t('label_no_group')}</MenuItem>
              {groups.map((g, gi) => (
                <MenuItem key={g.id} value={g.id}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: `${GROUP_COLORS[gi % GROUP_COLORS.length]}.main`,
                        flexShrink: 0,
                      }}
                    />
                    <span>{g.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
      </Stack>
    </Card>
  );
}
