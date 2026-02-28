import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

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

import { TeamFormDialog } from './team-form-dialog';
import { PlayerDataGrid } from './player-data-grid';

// ----------------------------------------------------------------------

export function TeamList({ tournamentId, teams, groups }) {
  const [teamDialog, setTeamDialog] = useState({ open: false, team: null });
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSlots, setGroupSlots] = useState(2);

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
      // Remove from current group first, then assign to new
      const removeOps = (groups || [])
        .filter((g) => g.teams?.some((gt) => gt.team_id === teamId))
        .map((g) => removeTeamFromGroup(tournamentId, g.id, teamId));
      await Promise.all(removeOps);
      await assignTeamToGroup(tournamentId, newGroupId, teamId);
      toast.success('Equipo asignado');
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const handleRandomAssign = async () => {
    if (!groups?.length) {
      toast.error('Crea grupos primero');
      return;
    }
    try {
      // Clear all groups first
      const removeOps = groups.flatMap((g) =>
        (g.teams || []).map((gt) => removeTeamFromGroup(tournamentId, g.id, gt.team_id))
      );
      await Promise.all(removeOps);
      // Shuffle and distribute evenly
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const assignOps = shuffled.map((team, idx) => {
        const group = groups[idx % groups.length];
        return assignTeamToGroup(tournamentId, group.id, team.id);
      });
      await Promise.all(assignOps);
      toast.success(`${shuffled.length} equipos asignados aleatoriamente`);
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const hasGroups = groups?.length > 0;

  return (
    <>
      {/* Group Management */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Grupos</Typography>
          <Stack direction="row" spacing={1}>
            {hasGroups && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="mdi:shuffle-variant" />}
                onClick={handleRandomAssign}
                disabled={teams.length < 2}
              >
                Asignar Aleatorio
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setGroupDialog(true)}
            >
              Agregar Grupo
            </Button>
          </Stack>
        </Stack>

        {!hasGroups ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Sin grupos. Crea grupos para organizar los equipos por fase de grupos.
          </Typography>
        ) : (
          <Box gap={2} display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(groups.length, 4)}, 1fr)` }}>
            {groups.map((group) => {
              const groupTeams = teams.filter((t) =>
                group.teams?.some((gt) => gt.team_id === t.id)
              );

              return (
                <Card key={group.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{group.name}</Typography>
                      <Chip
                        label={`Clasifican: ${group.advancement_slots || 2}`}
                        size="small"
                        color="success"
                        variant="soft"
                      />
                    </Stack>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                  </Stack>

                  <Divider sx={{ mb: 1 }} />

                  {groupTeams.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
                      Sin equipos
                    </Typography>
                  ) : (
                    <Stack spacing={0.5}>
                      {groupTeams.map((t) => (
                        <Stack key={t.id} direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">{t.short_name || t.name}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Card>
              );
            })}
          </Box>
        )}
      </Card>

      {/* Teams */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setTeamDialog({ open: true, team: null })}
        >
          Agregar Equipo
        </Button>
      </Stack>

      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
      >
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            tournamentId={tournamentId}
            groups={groups}
            expanded={expandedTeam === team.id}
            onExpand={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
            onEdit={() => setTeamDialog({ open: true, team })}
            onDelete={() => handleDeleteTeam(team.id)}
            onAssignGroup={handleAssignTeam}
          />
        ))}
      </Box>

      {/* Create Group Dialog */}
      <Dialog open={groupDialog} onClose={() => setGroupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Grupo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del Grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Grupo A"
            />
            <TextField
              fullWidth
              type="number"
              label="Equipos que clasifican"
              value={groupSlots}
              onChange={(e) => setGroupSlots(Number(e.target.value))}
              helperText="Número de equipos que avanzan a fase eliminatoria"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateGroup} disabled={!groupName}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      <TeamFormDialog
        open={teamDialog.open}
        onClose={() => setTeamDialog({ open: false, team: null })}
        tournamentId={tournamentId}
        currentTeam={teamDialog.team}
        groups={groups}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function TeamCard({
  team,
  tournamentId,
  groups,
  expanded,
  onExpand,
  onEdit,
  onDelete,
  onAssignGroup,
}) {
  const { players } = useGetPlayers(expanded ? tournamentId : null, team.id);
  const hasGroups = groups?.length > 0;
  const currentGroupId = groups?.find((g) => g.teams?.some((gt) => gt.team_id === team.id))?.id || '';

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1">{team.name}</Typography>
          {team.short_name && (
            <Chip label={team.short_name} size="small" variant="outlined" />
          )}
          {currentGroupId && <Chip label={groups?.find((g) => g.id === currentGroupId)?.name} size="small" color="primary" variant="soft" />}
        </Stack>

        <Stack direction="row" alignItems="center">
          {hasGroups && (
            <FormControl size="small" sx={{ minWidth: 100, mr: 0.5 }}>
              <InputLabel>Grupo</InputLabel>
              <Select
                value={currentGroupId}
                label="Grupo"
                onChange={(e) => onAssignGroup(team.id, e.target.value)}
                size="small"
              >
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <IconButton size="small" onClick={onExpand}>
            <Iconify icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
          </IconButton>
          <IconButton size="small" onClick={onEdit}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
      </Stack>

      {expanded && (
        <PlayerDataGrid
          tournamentId={tournamentId}
          teamId={team.id}
          players={players}
        />
      )}
    </Card>
  );
}
