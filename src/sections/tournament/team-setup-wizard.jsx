import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useRef, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  createTeam,
  updateTeam,
  useGetTeam,
  deletePlayer,
  useGetPlayers,
  removeTeamDocument,
  confirmTeamDocument,
  getTeamLogoUploadUrl,
  getTeamDocumentUploadUrl,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { PlayerFormDialog } from './player-form-dialog';

// ======================================================================
// CONSTANTS
// ======================================================================

const COLOR_OPTIONS = [
  '#1A7F4B', '#1D4ED8', '#DC2626', '#D97706',
  '#7C3AED', '#0891B2', '#18181A', '#BE185D',
];

const POSITION_LABELS = {
  Goalkeeper: 'POR',
  Defender: 'DEF',
  Midfielder: 'MED',
  Forward: 'DEL',
};

const POSITION_ICONS = {
  Goalkeeper: 'mdi:hand-back-right',
  Defender: 'mdi:shield-outline',
  Midfielder: 'mdi:strategy',
  Forward: 'mdi:soccer',
};

const STEPS = [
  { key: 'identity', label: 'Identidad', number: '01' },
  { key: 'roster', label: 'Plantilla', number: '02' },
  { key: 'documents', label: 'Documentos', number: '03' },
  { key: 'rules', label: 'Reglamento', number: '04' },
  { key: 'review', label: 'Revisión', number: '05' },
];

const TeamSchema = zod.object({
  name: zod.string().min(1, 'El nombre es obligatorio'),
  short_name: zod.string().max(3, 'Máximo 3 caracteres').optional().or(zod.literal('')),
  group_id: zod.string().optional(),
  seed: zod.coerce.number().int().min(1).optional(),
  // UI-only
  manager_name: zod.string().optional(),
  contact_email: zod.string().email().optional().or(zod.literal('')),
  primary_color: zod.string().optional(),
});

// ======================================================================
// MAIN WIZARD
// ======================================================================

export function TeamSetupWizard({ tournamentId, currentTeam, groups, onComplete }) {
  const theme = useTheme();
  const isEdit = !!currentTeam;
  const [activeStep, setActiveStep] = useState(0);
  const [teamId, setTeamId] = useState(currentTeam?.id || null);
  const [rulesAccepted, setRulesAccepted] = useState(currentTeam?.rules_accepted || false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(currentTeam?.logo_url || null);
  const logoInputRef = useRef(null);

  const methods = useForm({
    resolver: zodResolver(TeamSchema),
    defaultValues: {
      name: currentTeam?.name || '',
      short_name: currentTeam?.short_name || '',
      group_id: currentTeam?.group_id || '',
      seed: currentTeam?.seed || 1,
      manager_name: '',
      contact_email: '',
      primary_color: COLOR_OPTIONS[0],
    },
    mode: 'onChange',
  });

  const {
    watch,
    trigger,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // For edit mode, load players + team (for documents)
  const { players = [] } = useGetPlayers(teamId ? tournamentId : null, teamId);
  const { team: teamData } = useGetTeam(teamId ? tournamentId : null, teamId);
  const teamDocuments = teamData?.documents || {};

  // Derive unlocked steps — all steps unlocked once team has a name
  const unlockedSteps = new Set([0]);
  if (values.name) { unlockedSteps.add(1); unlockedSteps.add(2); unlockedSteps.add(3); unlockedSteps.add(4); }

  const handleStepClick = useCallback(
    (step) => {
      if (unlockedSteps.has(step)) setActiveStep(step);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values.name]
  );

  const handleNext = useCallback(async () => {
    if (activeStep === 0) {
      const valid = await trigger(['name']);
      if (!valid) return;

      // Auto-save team on completing Step 1
      if (!teamId) {
        try {
          const payload = {
            name: values.name,
            short_name: values.short_name || undefined,
            group_id: values.group_id || undefined,
            seed: values.seed,
            manager_name: values.manager_name || undefined,
            contact_email: values.contact_email || undefined,
            primary_color: values.primary_color || undefined,
          };
          const result = await createTeam(tournamentId, payload);
          setTeamId(result.id);
          if (logoFile) {
            try {
              const { key, url } = await getTeamLogoUploadUrl(tournamentId, result.id, logoFile.name, logoFile.type);
              await fetch(url, { method: 'PUT', body: logoFile, headers: { 'Content-Type': logoFile.type } });
              await updateTeam(tournamentId, result.id, { logo_url: key });
            } catch {
              // best-effort
            }
          }
          toast.success('Equipo creado — ahora agrega jugadores');
        } catch (error) {
          toast.error(error.message || 'Error al crear equipo');
          return;
        }
      } else {
        // Update existing team
        try {
          const payload = {
            name: values.name,
            short_name: values.short_name || undefined,
            seed: values.seed,
            manager_name: values.manager_name || undefined,
            contact_email: values.contact_email || undefined,
            primary_color: values.primary_color || undefined,
          };
          if (logoFile) {
            const { key, url } = await getTeamLogoUploadUrl(tournamentId, teamId, logoFile.name, logoFile.type);
            await fetch(url, { method: 'PUT', body: logoFile, headers: { 'Content-Type': logoFile.type } });
            payload.logo_url = key;
          }
          await updateTeam(tournamentId, teamId, payload);
        } catch (error) {
          toast.error(error.message || 'Error al actualizar');
          return;
        }
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [activeStep, trigger, values, teamId, tournamentId, logoFile]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinish = useCallback(async () => {
    if (teamId && rulesAccepted) {
      try {
        await updateTeam(tournamentId, teamId, { rules_accepted: true });
      } catch {
        // non-blocking — finish anyway
      }
    }
    toast.success(isEdit ? 'Equipo actualizado' : '¡Equipo registrado exitosamente!');
    onComplete?.();
  }, [isEdit, onComplete, teamId, tournamentId, rulesAccepted]);

  // Step completion checks
  const isStepDone = (index) => {
    if (index === 0) return !!values.name;
    if (index === 1) return !!teamId && players.length > 0;
    if (index === 2) {
      const requiredKeys = DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.key);
      return !!teamId && requiredKeys.every((k) => (teamDocuments[k] || []).length > 0);
    }
    if (index === 3) return rulesAccepted;
    return false;
  };

  const getStepValue = (stepKey) => {
    switch (stepKey) {
      case 'identity': return values.name || '—';
      case 'roster': return teamId ? `${players.length} jugadores` : '—';
      case 'documents': {
        const totalFiles = Object.values(teamDocuments).reduce((sum, arr) => sum + (arr?.length || 0), 0);
        return teamId ? `${totalFiles} archivo${totalFiles !== 1 ? 's' : ''}` : '—';
      }
      case 'rules': return rulesAccepted ? 'Aceptado' : 'Pendiente';
      case 'review': return isStepDone(0) && isStepDone(1) ? 'Listo' : 'Pendiente';
      default: return '—';
    }
  };

  // Roster stats
  const positionCounts = {
    Goalkeeper: players.filter((p) => p.position === 'Goalkeeper').length,
    Defender: players.filter((p) => p.position === 'Defender').length,
    Midfielder: players.filter((p) => p.position === 'Midfielder').length,
    Forward: players.filter((p) => p.position === 'Forward').length,
  };
  const unassigned = players.filter((p) => !p.position).length;

  return (
    <Form methods={methods}>
      <Grid container spacing={0} sx={{ minHeight: 500 }}>
        {/* ── LEFT STEPPER ── */}
        <Grid
          xs={12}
          md={2.5}
          sx={{
            borderRight: { md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` },
            borderBottom: { xs: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`, md: 'none' },
          }}
        >
          <WizardStepper
            steps={STEPS}
            activeStep={activeStep}
            unlockedSteps={unlockedSteps}
            isStepDone={isStepDone}
            getStepValue={getStepValue}
            onStepClick={handleStepClick}
            onCancel={onComplete}
          />
        </Grid>

        {/* ── MAIN CONTENT ── */}
        <Grid
          xs={12}
          md={6.5}
          sx={{ p: { xs: 2, md: 4 }, overflowY: 'auto', maxHeight: { md: 'calc(100vh - 180px)' } }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              {isEdit ? 'Editar equipo' : 'Registrar equipo'}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {isEdit ? 'Actualiza tu equipo.' : 'Crea tu equipo.'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480 }}>
              Completa la identidad del equipo, agrega jugadores y revisa antes de finalizar.
            </Typography>
          </Box>

          {/* Hidden logo file input — shared across step renders */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }
              e.target.value = '';
            }}
          />

          {/* Step content */}
          {activeStep === 0 && (
            <StepIdentity
              values={values}
              setValue={setValue}
              logoPreview={logoPreview}
              logoInputRef={logoInputRef}
              onLogoChange={(file) => {
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }}
            />
          )}
          {activeStep === 1 && (
            <StepRoster
              tournamentId={tournamentId}
              teamId={teamId}
              players={players}
              positionCounts={positionCounts}
            />
          )}
          {activeStep === 2 && (
            <StepDocuments tournamentId={tournamentId} teamId={teamId} />
          )}
          {activeStep === 3 && (
            <StepRules accepted={rulesAccepted} onToggle={() => setRulesAccepted(!rulesAccepted)} />
          )}
          {activeStep === 4 && (
            <StepReview
              values={values}
              players={players}
              positionCounts={positionCounts}
            />
          )}

          {/* Navigation */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Anterior
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <LoadingButton
                variant="contained"
                onClick={handleNext}
                loading={isSubmitting}
                endIcon={<Iconify icon="eva:arrow-forward-fill" />}
              >
                Siguiente
              </LoadingButton>
            ) : (
              <LoadingButton
                variant="contained"
                color="success"
                onClick={handleFinish}
                loading={isSubmitting}
                endIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              >
                {isEdit ? 'Guardar cambios' : 'Finalizar registro'}
              </LoadingButton>
            )}
          </Stack>
        </Grid>

        {/* ── RIGHT SUMMARY ── */}
        <Grid
          xs={12}
          md={3}
          sx={{
            borderLeft: { md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` },
            borderTop: { xs: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`, md: 'none' },
          }}
        >
          <WizardSummary
            values={values}
            players={players}
            positionCounts={positionCounts}
            unassigned={unassigned}
            teamId={teamId}
            rulesAccepted={rulesAccepted}
            logoPreview={logoPreview}
          />
        </Grid>
      </Grid>
    </Form>
  );
}

// ======================================================================
// STEP 1 — IDENTIDAD
// ======================================================================

function StepIdentity({ values, setValue, logoPreview, logoInputRef, onLogoChange }) {
  const initials = values.short_name || values.name?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <FormSection number="01" title="Identidad del equipo">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        {/* Logo */}
        <Stack alignItems="center" spacing={1.5} sx={{ minWidth: 140 }}>
          <Avatar
            src={logoPreview || undefined}
            sx={{
              width: 96,
              height: 96,
              fontSize: 28,
              fontWeight: 700,
              bgcolor: values.primary_color || COLOR_OPTIONS[0],
              color: 'common.white',
              border: (t) => `3px solid ${alpha(t.palette.grey[500], 0.12)}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { opacity: 0.8, transform: 'scale(1.05)' },
            }}
            onClick={() => logoInputRef.current?.click()}
          >
            {!logoPreview && initials}
          </Avatar>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mdi:camera-plus-outline" width={16} />}
            onClick={() => logoInputRef.current?.click()}
            sx={{ fontSize: 11 }}
          >
            {logoPreview ? 'Cambiar logo' : 'Subir logo'}
          </Button>
        </Stack>

        {/* Fields */}
        <Stack spacing={2.5} sx={{ flex: 1 }}>
          <Field.Text name="name" label="Nombre del equipo" placeholder="Ej. Real Bogotá FC" required />

          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <Field.Text name="short_name" label="Abreviatura" placeholder="RBG" helperText="Máximo 3 caracteres" />
            </Grid>
            <Grid xs={12} sm={6}>
              <Field.Text name="seed" label="Seed" type="number" helperText="Posición para el sorteo" />
            </Grid>
          </Grid>

          {/* Color picker */}
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Color del equipo
            </Typography>
            <Stack direction="row" spacing={1}>
              {COLOR_OPTIONS.map((color) => (
                <IconButton
                  key={color}
                  onClick={() => setValue('primary_color', color)}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: color,
                    border: values.primary_color === color ? '2.5px solid' : '2.5px solid transparent',
                    borderColor: values.primary_color === color ? 'text.primary' : 'transparent',
                    borderRadius: '50%',
                    '&:hover': { bgcolor: color, opacity: 0.8 },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>

      {/* Manager + Email */}
      <Grid container spacing={2.5} sx={{ mt: 2 }}>
        <Grid xs={12} sm={6}>
          <Field.Text
            name="manager_name"
            label="Director técnico / Manager"
            placeholder="Nombre del DT"
            InputProps={{
              startAdornment: (
                <Iconify icon="mdi:account-tie" width={20} sx={{ mr: 1, color: 'text.disabled' }} />
              ),
            }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <Field.Text
            name="contact_email"
            label="Email de contacto"
            placeholder="dt@equipo.com"
            InputProps={{
              startAdornment: (
                <Iconify icon="mdi:email-outline" width={20} sx={{ mr: 1, color: 'text.disabled' }} />
              ),
            }}
          />
        </Grid>
      </Grid>
    </FormSection>
  );
}

// ======================================================================
// STEP 2 — PLANTILLA
// ======================================================================

const POSITION_COLORS = {
  Goalkeeper: 'warning',
  Defender: 'info',
  Midfielder: 'success',
  Forward: 'error',
};

function StepRoster({ tournamentId, teamId, players, positionCounts }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const handleAdd = () => {
    setEditingPlayer(null);
    setDialogOpen(true);
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingPlayer(null);
  };

  const handleDelete = useCallback(
    async (playerId) => {
      try {
        await deletePlayer(tournamentId, playerId);
        toast.success('Jugador eliminado');
      } catch (error) {
        toast.error(error.message || 'Error al eliminar');
      }
    },
    [tournamentId]
  );

  if (!teamId) {
    return (
      <FormSection number="02" title="Plantilla de jugadores">
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.24)}`,
            boxShadow: 'none',
          }}
        >
          <Iconify icon="mdi:account-group-outline" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Completa el paso anterior para agregar jugadores.
          </Typography>
        </Card>
      </FormSection>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => (a.number ?? 99) - (b.number ?? 99));

  return (
    <FormSection number="02" title="Plantilla de jugadores">
      {/* Position stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        {Object.entries(POSITION_LABELS).map(([key, label]) => (
          <Card
            key={key}
            sx={{
              flex: 1,
              py: 1.5,
              px: 1,
              textAlign: 'center',
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              boxShadow: 'none',
            }}
          >
            <Iconify icon={POSITION_ICONS[key]} width={20} sx={{ color: `${POSITION_COLORS[key]}.main`, mb: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {positionCounts[key]}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {label}
            </Typography>
          </Card>
        ))}
      </Stack>

      {/* Player count banner */}
      <Card
        sx={{
          p: 2,
          mb: 2,
          bgcolor: players.length >= 11 ? 'success.lighter' : 'warning.lighter',
          border: '1px solid',
          borderColor: players.length >= 11 ? 'success.light' : 'warning.light',
          boxShadow: 'none',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon={players.length >= 11 ? 'mdi:check-circle' : 'mdi:alert-circle-outline'}
              width={20}
              sx={{ color: players.length >= 11 ? 'success.dark' : 'warning.dark' }}
            />
            <Typography variant="body2" sx={{ color: players.length >= 11 ? 'success.dark' : 'warning.dark' }}>
              {players.length} jugador{players.length !== 1 ? 'es' : ''} registrado{players.length !== 1 ? 's' : ''}
              {players.length < 11 && ` — faltan ${11 - players.length} para completar el equipo`}
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" width={16} />}
            onClick={handleAdd}
          >
            Agregar jugador
          </Button>
        </Stack>
      </Card>

      {/* Player list */}
      {sortedPlayers.length === 0 ? (
        <Card
          sx={{
            py: 5,
            textAlign: 'center',
            border: (t) => `2px dashed ${alpha(t.palette.grey[500], 0.14)}`,
            boxShadow: 'none',
          }}
        >
          <Iconify icon="mdi:account-plus-outline" width={40} sx={{ color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Sin jugadores todavía
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Agrega al menos 11 jugadores para completar la plantilla
          </Typography>
        </Card>
      ) : (
        <Card sx={{ overflow: 'hidden', boxShadow: 'none', border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }}>
          <Stack divider={<Box sx={{ borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }} />}>
            {sortedPlayers.map((player) => (
              <Stack
                key={player.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ px: 2, py: 1.25 }}
              >
                {/* Jersey number */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {player.number || '—'}
                  </Typography>
                </Box>

                {/* Name */}
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>
                  {player.name}
                </Typography>

                {/* Position */}
                {player.position ? (
                  <Chip
                    label={POSITION_LABELS[player.position] || player.position}
                    size="small"
                    color={POSITION_COLORS[player.position] || 'default'}
                    variant="soft"
                    sx={{ fontSize: 11, fontWeight: 600, minWidth: 80 }}
                  />
                ) : (
                  <Chip label="Sin posición" size="small" variant="soft" sx={{ fontSize: 11, minWidth: 80 }} />
                )}

                {/* Actions */}
                <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => handleEdit(player)} sx={{ color: 'text.secondary' }}>
                    <Iconify icon="solar:pen-bold" width={15} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(player.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={15} />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      <PlayerFormDialog
        open={dialogOpen}
        onClose={handleClose}
        tournamentId={tournamentId}
        teamId={teamId}
        currentPlayer={editingPlayer}
      />
    </FormSection>
  );
}

// ======================================================================
// STEP 3 — DOCUMENTOS
// ======================================================================

const DOCUMENT_TYPES = [
  {
    key: 'player_ids',
    icon: 'mdi:card-account-details-outline',
    title: 'Identificación de jugadores',
    description: 'Cédula o documento de identidad de cada integrante',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    multiple: true,
  },
  {
    key: 'insurance',
    icon: 'mdi:shield-check-outline',
    title: 'Póliza de seguro',
    description: 'Seguro médico o de accidentes deportivos',
    required: true,
    accept: '.pdf',
    multiple: false,
  },
  {
    key: 'medical',
    icon: 'mdi:hospital-box-outline',
    title: 'Certificados médicos',
    description: 'Aptitud física de cada jugador',
    required: false,
    accept: '.pdf,.jpg,.jpeg,.png',
    multiple: true,
  },
  {
    key: 'consent',
    icon: 'mdi:file-sign',
    title: 'Consentimiento informado',
    description: 'Autorización firmada para menores de edad',
    required: false,
    accept: '.pdf',
    multiple: true,
  },
];

function StepDocuments({ tournamentId, teamId }) {
  const { team, revalidateTeam } = useGetTeam(tournamentId, teamId);
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const fileInputRefs = useRef({});

  const documents = team?.documents || {};

  const requiredDone = DOCUMENT_TYPES.filter((d) => d.required).every(
    (d) => (documents[d.key] || []).length > 0
  );

  const handleUpload = useCallback(
    async (docType, files) => {
      if (!teamId || !files?.length) return;
      setUploading((prev) => ({ ...prev, [docType]: true }));
      try {
        await Promise.all(
          Array.from(files).map(async (file) => {
            const ct = file.type || 'application/octet-stream';
            const { key, url: presignedUrl } = await getTeamDocumentUploadUrl(
              tournamentId, teamId, docType, file.name, ct
            );
            await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': ct } });
            await confirmTeamDocument(tournamentId, teamId, docType, file.name, key);
          })
        );
        await revalidateTeam();
        toast.success('Documento subido');
      } catch (error) {
        toast.error(error.message || 'Error al subir documento');
      } finally {
        setUploading((prev) => ({ ...prev, [docType]: false }));
      }
    },
    [tournamentId, teamId, revalidateTeam]
  );

  const handleDelete = useCallback(
    async (docType, key) => {
      const deleteKey = `${docType}:${key}`;
      setDeleting((prev) => ({ ...prev, [deleteKey]: true }));
      try {
        await removeTeamDocument(tournamentId, teamId, docType, key);
        await revalidateTeam();
        toast.success('Documento eliminado');
      } catch (error) {
        toast.error(error.message || 'Error al eliminar');
      } finally {
        setDeleting((prev) => ({ ...prev, [deleteKey]: false }));
      }
    },
    [tournamentId, teamId, revalidateTeam]
  );

  if (!teamId) {
    return (
      <FormSection number="03" title="Documentos del equipo">
        <Card sx={{ p: 4, textAlign: 'center', border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.24)}`, boxShadow: 'none' }}>
          <Iconify icon="mdi:file-document-outline" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Completa el paso anterior para subir documentos.
          </Typography>
        </Card>
      </FormSection>
    );
  }

  return (
    <FormSection number="03" title="Documentos del equipo">
      {/* Completion status */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: requiredDone ? 'success.lighter' : 'warning.lighter',
          border: '1px solid',
          borderColor: requiredDone ? 'success.light' : 'warning.light',
          boxShadow: 'none',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify
            icon={requiredDone ? 'mdi:check-circle' : 'mdi:alert-circle-outline'}
            width={20}
            sx={{ color: requiredDone ? 'success.dark' : 'warning.dark' }}
          />
          <Typography variant="body2" sx={{ color: requiredDone ? 'success.dark' : 'warning.dark' }}>
            {requiredDone
              ? 'Documentos obligatorios completos'
              : 'Sube los documentos obligatorios para continuar'}
          </Typography>
        </Stack>
      </Card>

      <Stack spacing={2}>
        {DOCUMENT_TYPES.map((doc) => {
          const files = documents[doc.key] || [];
          const isUploading = uploading[doc.key];
          const hasDocs = files.length > 0;

          return (
            <Card
              key={doc.key}
              sx={{
                p: 2.5,
                border: (t) => `1px solid ${
                  hasDocs
                    ? alpha(t.palette.success.main, 0.24)
                    : alpha(t.palette.grey[500], 0.12)
                }`,
                boxShadow: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Header */}
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: hasDocs
                      ? (t) => alpha(t.palette.success.main, 0.1)
                      : (t) => alpha(t.palette.primary.main, 0.08),
                    flexShrink: 0,
                  }}
                >
                  <Iconify
                    icon={hasDocs ? 'mdi:check-circle' : doc.icon}
                    width={22}
                    sx={{ color: hasDocs ? 'success.main' : 'primary.main' }}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2">{doc.title}</Typography>
                    {doc.required && !hasDocs && (
                      <Chip label="Requerido" size="small" color="error" variant="soft" sx={{ height: 18, fontSize: 10 }} />
                    )}
                    {hasDocs && (
                      <Chip label={`${files.length} archivo${files.length > 1 ? 's' : ''}`} size="small" color="success" variant="soft" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {doc.description}
                  </Typography>
                </Box>

                {/* Upload button */}
                <Button
                  size="small"
                  variant={hasDocs ? 'outlined' : 'contained'}
                  color={hasDocs ? 'inherit' : 'primary'}
                  loading={isUploading}
                  disabled={isUploading}
                  startIcon={<Iconify icon="mdi:cloud-upload-outline" width={16} />}
                  onClick={() => fileInputRefs.current[doc.key]?.click()}
                  sx={{ flexShrink: 0 }}
                >
                  {hasDocs ? 'Agregar' : 'Subir'}
                </Button>

                <input
                  ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                  type="file"
                  accept={doc.accept}
                  multiple={doc.multiple}
                  hidden
                  onChange={(e) => {
                    handleUpload(doc.key, e.target.files);
                    e.target.value = '';
                  }}
                />
              </Stack>

              {/* Uploaded file list */}
              {files.length > 0 && (
                <Stack
                  spacing={0.5}
                  sx={{
                    mt: 2,
                    pl: 7,
                    borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
                    pt: 1.5,
                  }}
                >
                  {files.map((file) => {
                    const deleteKey = `${doc.key}:${file.key}`;
                    const isDeleting = deleting[deleteKey];
                    return (
                      <Stack
                        key={file.key}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Iconify
                          icon={file.name?.endsWith('.pdf') ? 'mdi:file-pdf-box' : 'mdi:file-image'}
                          width={18}
                          sx={{ color: 'text.secondary', flexShrink: 0 }}
                        />
                        <Typography
                          component="a"
                          href={file.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{
                            flex: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          noWrap
                        >
                          {file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                          {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString('es') : ''}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isDeleting}
                          onClick={() => handleDelete(doc.key, file.key)}
                          sx={{ flexShrink: 0 }}
                        >
                          <Iconify icon={isDeleting ? 'mdi:loading' : 'solar:trash-bin-trash-bold'} width={14} />
                        </IconButton>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Card>
          );
        })}
      </Stack>
    </FormSection>
  );
}

// ======================================================================
// STEP 4 — REGLAMENTO
// ======================================================================

const RULES_SECTIONS = [
  {
    title: '1. Formato de competencia',
    content: 'El torneo se disputa en formato de grupos + eliminación directa. Cada equipo jugará al menos 3 partidos en la fase de grupos. Los dos primeros de cada grupo avanzarán a la fase eliminatoria.',
  },
  {
    title: '2. Inscripción de jugadores',
    content: 'Cada equipo debe inscribir un mínimo de 11 y un máximo de 25 jugadores. No se permitirán cambios de plantilla después de la fecha límite de inscripción. Los jugadores deben presentar documento de identidad.',
  },
  {
    title: '3. Reglas disciplinarias',
    content: 'Dos tarjetas amarillas acumuladas resultan en un partido de suspensión. Una tarjeta roja directa resulta en mínimo un partido de suspensión, sujeto a revisión del comité disciplinario.',
  },
  {
    title: '4. Horarios y sedes',
    content: 'Los horarios serán publicados con al menos 48 horas de anticipación. El equipo local será responsable de proporcionar los balones. Los equipos deben presentarse 15 minutos antes del inicio.',
  },
  {
    title: '5. Criterios de desempate',
    content: 'En caso de empate en puntos se considerará: 1) Diferencia de goles, 2) Goles a favor, 3) Resultado entre los equipos empatados, 4) Sorteo.',
  },
];

function StepRules({ accepted, onToggle }) {
  return (
    <FormSection number="04" title="Reglamento del torneo">
      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'info.lighter',
          border: '1px solid',
          borderColor: 'info.light',
          boxShadow: 'none',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:information-outline" width={20} sx={{ color: 'info.dark' }} />
          <Typography variant="body2" sx={{ color: 'info.dark' }}>
            Lee atentamente el reglamento antes de inscribir a tu equipo.
          </Typography>
        </Stack>
      </Card>

      <Card
        sx={{
          p: 3,
          mb: 3,
          maxHeight: 360,
          overflowY: 'auto',
          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          boxShadow: 'none',
        }}
      >
        <Stack spacing={3}>
          {RULES_SECTIONS.map((section) => (
            <Box key={section.title}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {section.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                {section.content}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>

      <Card
        sx={{
          p: 2,
          border: '1.5px solid',
          borderColor: accepted ? 'success.main' : (t) => alpha(t.palette.grey[500], 0.16),
          bgcolor: accepted ? 'success.lighter' : 'transparent',
          boxShadow: 'none',
          transition: 'all 0.2s',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={onToggle}
              color="success"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              He leído y acepto el reglamento del torneo y sus disposiciones disciplinarias.
            </Typography>
          }
        />
      </Card>
    </FormSection>
  );
}

// ======================================================================
// STEP 5 — REVISIÓN
// ======================================================================

function StepReview({ values, players, positionCounts }) {
  const initials = values.short_name || values.name?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <FormSection number="03" title="Revisión final">
      {/* Team card */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 64,
              height: 64,
              fontSize: 22,
              fontWeight: 700,
              bgcolor: values.primary_color || COLOR_OPTIONS[0],
              color: 'common.white',
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {values.name || '—'}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {values.short_name && (
                <Chip label={values.short_name} size="small" variant="outlined" />
              )}
              {values.manager_name && (
                <Chip
                  icon={<Iconify icon="mdi:account-tie" width={14} />}
                  label={values.manager_name}
                  size="small"
                  variant="soft"
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Card>

      {/* Roster summary */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Iconify icon="mdi:account-group" width={20} />
          <Typography variant="subtitle1">Plantilla ({players.length})</Typography>
        </Stack>

        {/* Position breakdown */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {Object.entries(POSITION_LABELS).map(([key, label]) => (
            <Box key={key} sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {positionCounts[key]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Player list */}
        {players.length > 0 ? (
          <Stack spacing={0.5}>
            {players.map((player) => (
              <Stack
                key={player.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ py: 0.75 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 24,
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {player.number || '—'}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                  {player.name}
                </Typography>
                <Chip
                  label={POSITION_LABELS[player.position] || '—'}
                  size="small"
                  variant="soft"
                  color={player.position ? 'primary' : 'default'}
                  sx={{ fontSize: 11 }}
                />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No hay jugadores registrados
          </Typography>
        )}
      </Card>
    </FormSection>
  );
}

// ======================================================================
// LEFT STEPPER
// ======================================================================

function WizardStepper({ steps, activeStep, unlockedSteps, isStepDone, getStepValue, onStepClick, onCancel }) {
  return (
    <Stack sx={{ p: 3, height: '100%', position: { md: 'sticky' }, top: { md: 0 } }}>
      <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2 }}>
        Registro de equipo
      </Typography>

      <Stack spacing={0.25} sx={{ flex: 1 }}>
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = isStepDone(index);
          const isLocked = !unlockedSteps.has(index);

          return (
            <Box key={step.key}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => onStepClick(index)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.35 : 1,
                  bgcolor: isActive ? (t) => alpha(t.palette.primary.main, 0.06) : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isLocked ? 'transparent' : (t) => alpha(t.palette.primary.main, 0.04),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                    border: (t) =>
                      `1.5px solid ${
                        isDone || isActive
                          ? t.palette.primary.main
                          : alpha(t.palette.grey[500], 0.24)
                      }`,
                    bgcolor: isDone ? (t) => alpha(t.palette.primary.main, 0.1) : 'transparent',
                    color: isDone || isActive ? 'primary.main' : 'text.disabled',
                    ...(isActive && {
                      boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.08)}`,
                    }),
                  }}
                >
                  {isDone ? <Iconify icon="eva:checkmark-fill" width={14} /> : step.number}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive || isDone ? 600 : 500,
                      color: isActive || isDone ? 'text.primary' : 'text.secondary',
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDone ? 'primary.main' : 'text.disabled',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getStepValue(step.key)}
                  </Typography>
                </Box>
              </Stack>

              {index < steps.length - 1 && (
                <Box
                  sx={{
                    width: '1px',
                    height: 12,
                    ml: '26px',
                    bgcolor: isDone
                      ? (t) => alpha(t.palette.primary.main, 0.2)
                      : (t) => alpha(t.palette.grey[500], 0.12),
                    transition: 'background-color 0.3s',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Back to list */}
      <Button
        variant="soft"
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-back-fill" />}
        onClick={onCancel}
        sx={{ mt: 2 }}
      >
        Volver a la lista
      </Button>
    </Stack>
  );
}

// ======================================================================
// RIGHT SUMMARY
// ======================================================================

const REQUIREMENTS = [
  { key: 'name', label: 'Nombre del equipo', check: (v) => !!v.name },
  { key: 'shortName', label: 'Abreviatura', check: (v) => !!v.short_name },
  { key: 'players', label: 'Mínimo 11 jugadores', check: (_, p) => p.length >= 11 },
  { key: 'goalkeeper', label: 'Al menos 1 portero', check: (_, p) => p.some((pl) => pl.position === 'Goalkeeper') },
  { key: 'positions', label: 'Posiciones asignadas', check: (_, p) => p.length > 0 && p.every((pl) => !!pl.position) },
  { key: 'documents', label: 'Documentos subidos', check: () => false },
  { key: 'rules', label: 'Reglamento aceptado', check: (v, _p, extra) => extra?.rulesAccepted },
];

function WizardSummary({ values, players, positionCounts, unassigned, teamId, rulesAccepted, logoPreview }) {
  const extra = { rulesAccepted };
  const completedCount = REQUIREMENTS.filter((r) => r.check(values, players, extra)).length;
  const percentage = Math.round((completedCount / REQUIREMENTS.length) * 100);

  const initials = values.short_name || values.name?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <Stack
      sx={{
        p: 3,
        height: '100%',
        position: { md: 'sticky' },
        top: { md: 0 },
        gap: 2.5,
        overflowY: { md: 'auto' },
        maxHeight: { md: 'calc(100vh - 180px)' },
      }}
    >
      {/* Team preview card */}
      <Card
        sx={{
          p: 2,
          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          boxShadow: 'none',
          textAlign: 'center',
        }}
      >
        <Avatar
          src={logoPreview || undefined}
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 1,
            fontSize: 20,
            fontWeight: 700,
            bgcolor: values.primary_color || COLOR_OPTIONS[0],
            color: 'common.white',
          }}
        >
          {!logoPreview && initials}
        </Avatar>
        <Typography variant="subtitle2" noWrap>
          {values.name || 'Nombre del equipo'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {values.short_name || '—'} · {players.length} jugadores
        </Typography>
      </Card>

      <SummaryDivider />

      {/* Progress */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Configuración completa
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {percentage}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 3,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 1, bgcolor: 'primary.main' },
          }}
        />
      </Box>

      <SummaryDivider />

      {/* Roster breakdown */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Plantilla
        </Typography>
        <Stack spacing={0.75}>
          {Object.entries(POSITION_LABELS).map(([key, label]) => (
            <Stack key={key} direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon={POSITION_ICONS[key]} width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="caption">{label}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {positionCounts[key]}
              </Typography>
            </Stack>
          ))}
          {unassigned > 0 && (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'warning.main' }}>
                Sin posición
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {unassigned}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      <SummaryDivider />

      {/* Checklist */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Pendiente
        </Typography>
        <Stack spacing={0.5}>
          {REQUIREMENTS.map((req) => {
            const done = req.check(values, players, extra);
            return (
              <Stack key={req.key} direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: done ? 'primary.main' : (t) => alpha(t.palette.grey[500], 0.2),
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: done ? 'text.secondary' : 'text.disabled', flex: 1 }}
                >
                  {req.label}
                </Typography>
                {done && <Iconify icon="eva:checkmark-fill" width={14} sx={{ color: 'primary.main' }} />}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {/* Status footer */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }}>
        <Typography
          variant="caption"
          sx={{
            color: percentage === 100 ? 'success.main' : 'text.disabled',
            textAlign: 'center',
            display: 'block',
            fontWeight: percentage === 100 ? 600 : 400,
          }}
        >
          {percentage === 100
            ? '✓ Equipo listo para competir'
            : 'Completa los campos para continuar'}
        </Typography>
      </Box>
    </Stack>
  );
}

// ======================================================================
// SHARED
// ======================================================================

function FormSection({ number, title, children }) {
  return (
    <Card
      sx={{
        mb: 3,
        p: 3,
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        boxShadow: 'none',
        bgcolor: (t) => alpha(t.palette.background.paper, 0.6),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {number}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }} />
      </Stack>
      {children}
    </Card>
  );
}

function SummaryDivider() {
  return (
    <Box sx={{ borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }} />
  );
}
