import { mutate } from 'swr';
import { useState, useCallback } from 'react';

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

import { TeamSetupWizard } from './team-setup-wizard';

// ----------------------------------------------------------------------

const GROUP_COLORS = ['primary', 'info', 'warning', 'error', 'success', 'secondary'];


// ======================================================================
// MAIN COMPONENT
// ======================================================================

export function TeamList({ tournamentId, tournament, teams, groups }) {
  const [wizardMode, setWizardMode] = useState(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSlots, setGroupSlots] = useState(2);
  const [isAssigning, setIsAssigning] = useState(false);

  const isLocked = tournament?.status === 'active' || tournament?.status === 'finished';
  const totalTeams = tournament?.num_teams || teams.length;
  const inscriptionProgress = totalTeams > 0 ? Math.round((teams.length / totalTeams) * 100) : 0;

  const handleDeleteTeam = useCallback(
    async (teamId) => {
      try {
        await deleteTeam(tournamentId, teamId);
        toast.success('Equipo eliminado');
      } catch (error) {
        toast.error('Error al eliminar equipo');
      }
    },
    [tournamentId]
  );

  const handleCreateGroup = async () => {
    try {
      await createGroup(tournamentId, { name: groupName, advancement_slots: groupSlots });
      setGroupDialog(false);
      setGroupName('');
      setGroupSlots(2);
      toast.success('Grupo creado');
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(tournamentId, groupId);
      toast.success('Grupo eliminado');
    } catch (error) {
      toast.error(error.message || 'Error');
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
      toast.success('Equipo asignado');
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const handleRandomAssign = async () => {
    if (!groups?.length) { toast.error('Crea grupos primero'); return; }
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
      toast.success(`${shuffled.length} equipos asignados aleatoriamente`);
    } catch (error) {
      toast.error(error.message || 'Error');
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:account-group" width={20} sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Inscripción
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="baseline" spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {teams.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                /{totalTeams} equipos
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={inscriptionProgress}
              sx={{
                width: 120,
                height: 4,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  bgcolor: inscriptionProgress >= 100 ? 'success.main' : 'primary.main',
                },
              }}
            />

            <Typography variant="caption" sx={{ color: inscriptionProgress >= 100 ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
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
              Registrar Equipo
            </Button>
          )}
        </Stack>
      </Card>

      {/* ── Locked banner ── */}
      {isLocked && (
        <Card sx={{ p: 1.5, mb: 2, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="mdi:lock-outline" sx={{ color: 'warning.dark' }} />
            <Typography variant="body2" color="warning.dark">
              El torneo está {tournament.status === 'active' ? 'activo' : 'finalizado'}. No es posible modificar equipos.
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
              <Typography variant="subtitle1">Grupos</Typography>
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
                  Asignar Aleatorio
                </LoadingButton>
              )}
              <Button
                size="small"
                variant="soft"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => setGroupDialog(true)}
                disabled={isLocked}
              >
                Agregar Grupo
              </Button>
            </Stack>
          </Stack>

          {!hasGroups ? (
            <Card
              sx={{
                py: 4,
                textAlign: 'center',
                border: (t) => `2px dashed ${alpha(t.palette.grey[500], 0.12)}`,
                boxShadow: 'none',
              }}
            >
              <Iconify icon="mdi:group" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Sin grupos. Crea grupos para organizar los equipos.
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
                const groupTeams = teams.filter((t) =>
                  group.teams?.some((gt) => gt.team_id === t.id)
                );

                const accent = GROUP_COLORS[gi % GROUP_COLORS.length];

                return (
                  <Card
                    key={group.id}
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      boxShadow: 'none',
                      border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
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
                        bgcolor: (t) => alpha(t.palette[accent].main, 0.06),
                        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
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
                          label={`Cupos: ${group.advancement_slots || 2}`}
                          size="small"
                          color={accent}
                          variant="soft"
                          sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                        />
                      </Stack>
                      {!isLocked && (
                        <IconButton size="small" onClick={() => handleDeleteGroup(group.id)} sx={{ color: 'text.disabled' }}>
                          <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Team list */}
                    <Stack sx={{ px: 2, py: 1.5 }}>
                      {groupTeams.length === 0 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ py: 1, textAlign: 'center' }}>
                          Arrastra equipos aquí
                        </Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {groupTeams.map((t) => (
                            <Stack key={t.id} direction="row" alignItems="center" spacing={1.5}>
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  bgcolor: `${accent}.main`,
                                  color: 'common.white',
                                }}
                              >
                                {(t.short_name || t.name?.slice(0, 2))?.toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }} noWrap>
                                {t.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                {t.short_name || ''}
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
            border: (t) => `2px dashed ${alpha(t.palette.grey[500], 0.16)}`,
            boxShadow: 'none',
          }}
        >
          <Iconify icon="mdi:shield-plus-outline" width={56} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sin equipos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comienza registrando el primer equipo del torneo.
          </Typography>
          {!isLocked && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setWizardMode('create')}
            >
              Registrar primer equipo
            </Button>
          )}
        </Card>
      ) : (
        <Box
          gap={2}
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(3, 1fr)' }}
        >
          {teams.map((team) => (
            <TeamOverviewCard
              key={team.id}
              team={team}
              tournamentId={tournamentId}
              groups={groups}
              isLocked={isLocked}
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
            <span>Nuevo Grupo</span>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Organiza los equipos en grupos para la fase clasificatoria.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del Grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Grupo A"
              autoFocus
              InputProps={{
                startAdornment: (
                  <Iconify icon="mdi:label-outline" width={20} sx={{ mr: 1, color: 'text.disabled' }} />
                ),
              }}
            />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}>
                Cupos de clasificación (avanzan a siguiente ronda)
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
                      borderColor: groupSlots === n ? 'primary.main' : (t) => alpha(t.palette.grey[500], 0.16),
                      bgcolor: groupSlots === n ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: (t) => alpha(t.palette.primary.main, 0.4),
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: groupSlots === n ? 'primary.main' : 'text.primary' }}>
                      {n}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      equipo{n > 1 ? 's' : ''}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setGroupDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Crear grupo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ======================================================================
// TEAM OVERVIEW CARD
// ======================================================================

function TeamOverviewCard({ team, tournamentId, groups, isLocked, onEdit, onDelete, onAssignGroup }) {
  const { players = [] } = useGetPlayers(tournamentId, team.id);

  const currentGroupId = groups?.find((g) => g.teams?.some((gt) => gt.team_id === team.id))?.id || '';
  const currentGroup = groups?.find((g) => g.id === currentGroupId);
  const initials = team.short_name || team.name?.slice(0, 2)?.toUpperCase() || '?';

  // Setup steps with completion status
  const setupSteps = [
    {
      key: 'identity',
      label: 'Identidad',
      icon: 'mdi:shield-check-outline',
      done: !!team.name && !!team.short_name,
      detail: team.short_name ? `${team.name} (${team.short_name})` : team.name || 'Pendiente',
    },
    {
      key: 'roster',
      label: 'Plantilla',
      icon: 'mdi:account-group-outline',
      done: players.length >= 11,
      detail: `${players.length}/11 jugadores`,
    },
    {
      key: 'documents',
      label: 'Documentos',
      icon: 'mdi:file-document-outline',
      done: false,
      detail: 'Pendiente',
    },
    {
      key: 'rules',
      label: 'Reglamento',
      icon: 'mdi:gavel',
      done: false,
      detail: 'Sin aceptar',
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
        '&:hover': isLocked ? {} : {
          boxShadow: (t) => t.shadows[8],
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
            sx={{
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: 'primary.main',
              color: 'common.white',
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                {team.name}
              </Typography>
              {currentGroup && (
                <Chip label={currentGroup.name} size="small" color="primary" variant="soft" sx={{ height: 18, fontSize: 10 }} />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
              {team.manager_email || `${team.name.toLowerCase().replace(/\s+/g, '.')}@sportsmanage.com`}
            </Typography>
          </Box>

          {/* Actions */}
          {!isLocked && (
            <Stack direction="row" spacing={0.25}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Iconify icon="solar:pen-bold" width={14} />
              </IconButton>
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Iconify icon="solar:trash-bin-trash-bold" width={14} />
              </IconButton>
            </Stack>
          )}
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
                bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  bgcolor: progressPercent === 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: progressPercent === 100 ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
            {completedSteps}/{totalSteps} pasos
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
                    ? (t) => alpha(t.palette.success.main, 0.12)
                    : (t) => alpha(t.palette.grey[500], 0.08),
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
              <Typography variant="caption" sx={{ color: step.done ? 'success.main' : 'text.disabled', fontSize: 10 }}>
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
              label="Grupo"
              value={currentGroupId}
              onChange={(e) => {
                e.stopPropagation();
                onAssignGroup(team.id, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
            >
              <MenuItem value="">Sin grupo</MenuItem>
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


