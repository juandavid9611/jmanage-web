import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { createTeam, updateTeam, getTeamLogoUploadUrl } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const COLOR_OPTIONS = [
  '#1A7F4B',
  '#1D4ED8',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#18181A',
  '#BE185D',
];

function getTeamSchema(t) {
  return zod.object({
    name: zod.string().min(1, { message: t('name_required') }),
    short_name: zod
      .string()
      .max(3, { message: t('label_max_3_characters') })
      .optional(),
    group_id: zod.string().optional(),
    seed: zod.coerce.number().int().min(1).optional(),
    // UI-only fields (not sent to API)
    manager_name: zod.string().optional(),
    contact_email: zod.string().email().optional().or(zod.literal('')),
    contact_phone: zod.string().optional(),
    primary_color: zod.string().optional(),
  });
}

export function TeamFormDialog({ open, onClose, tournamentId, currentTeam, groups }) {
  const { t } = useTranslation();
  const isEdit = !!currentTeam;
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const defaultValues = {
    name: '',
    short_name: '',
    group_id: '',
    seed: 1,
    manager_name: '',
    contact_email: '',
    contact_phone: '',
    primary_color: COLOR_OPTIONS[0],
  };

  const TeamSchema = useMemo(() => getTeamSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(TeamSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: currentTeam?.name || '',
        short_name: currentTeam?.short_name || '',
        group_id: currentTeam?.group_id || '',
        seed: currentTeam?.seed || 1,
        manager_name: currentTeam?.manager_name || '',
        contact_email: currentTeam?.contact_email || '',
        contact_phone: currentTeam?.contact_phone || '',
        primary_color: currentTeam?.primary_color || COLOR_OPTIONS[0],
      });
      setLogoFile(null);
      setLogoPreview(currentTeam?.logo_url || null);
    }
  }, [open, currentTeam, reset]);

  const handleLogoSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const uploadLogoToS3 = async (teamId, file) => {
    const { key, url } = await getTeamLogoUploadUrl(tournamentId, teamId, file.name, file.type);
    await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return key;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        name: data.name,
        short_name: data.short_name,
        group_id: data.group_id || undefined,
        seed: data.seed,
        manager_name: data.manager_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        primary_color: data.primary_color,
      };

      if (isEdit) {
        if (logoFile) {
          const key = await uploadLogoToS3(currentTeam.id, logoFile);
          payload.logo_url = key;
        } else if (!logoPreview) {
          payload.logo_url = '';
        }
        await updateTeam(tournamentId, currentTeam.id, payload);
        toast.success(t('label_team_updated'));
      } else {
        const team = await createTeam(tournamentId, payload);
        if (logoFile) {
          const key = await uploadLogoToS3(team.id, logoFile);
          await updateTeam(tournamentId, team.id, { logo_url: key });
        }
        toast.success(t('label_team_created'));
      }
      onClose();
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    }
  });

  const initials = values.short_name || values.name?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="mdi:shield-half-full" width={24} />
            <span>{isEdit ? t('label_edit_team') : t('label_register_team')}</span>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {isEdit ? t('label_update_team_info_hint') : t('label_complete_team_info_hint')}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {/* ── Section 1: Identidad ── */}
          <FormSection number="01" title={t('label_team_identity')}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {/* Logo upload area */}
              <Stack alignItems="center" spacing={1.5} sx={{ minWidth: 140 }}>
                <Avatar
                  src={logoPreview}
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: 28,
                    fontWeight: 700,
                    bgcolor: values.primary_color || COLOR_OPTIONS[0],
                    color: 'common.white',
                    border: (theme) => `3px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={handleLogoSelect}
                >
                  {!logoPreview && initials}
                </Avatar>
                <Button
                  size="small"
                  variant="soft"
                  startIcon={<Iconify icon="mdi:camera-plus-outline" width={16} />}
                  onClick={handleLogoSelect}
                  sx={{ fontSize: 11 }}
                >
                  {t('label_upload_logo')}
                </Button>
              </Stack>

              {/* Name fields */}
              <Stack spacing={2.5} sx={{ flex: 1 }}>
                <Field.Text
                  name="name"
                  label={t('label_team_name')}
                  placeholder={t('label_team_name_example')}
                  required
                />

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Field.Text
                      name="short_name"
                      label={t('label_abbreviation')}
                      placeholder="RBG"
                      helperText={t('label_max_3_characters')}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Field.Text
                      name="seed"
                      label={t('label_seed')}
                      type="number"
                      helperText={t('label_seed_position_hint')}
                    />
                  </Grid>
                </Grid>

                {/* Color picker */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mb: 1, display: 'block' }}
                  >
                    {t('label_team_color')}
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
                          border:
                            values.primary_color === color
                              ? '2.5px solid'
                              : '2.5px solid transparent',
                          borderColor:
                            values.primary_color === color ? 'text.primary' : 'transparent',
                          borderRadius: '50%',
                          '&:hover': { bgcolor: color, opacity: 0.8 },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </FormSection>

          {/* ── Section 2: Información ── */}
          <FormSection number="02" title={t('label_information')}>
            <Grid container spacing={2.5}>
              <Grid xs={12}>
                <Field.Text
                  name="manager_name"
                  label={t('label_manager_or_coach')}
                  placeholder={t('label_coach_name_placeholder')}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="mdi:account-tie"
                        width={20}
                        sx={{ mr: 1, color: 'text.disabled' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <Field.Text
                  name="contact_email"
                  label={t('label_contact_email')}
                  placeholder="dt@equipo.com"
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="mdi:email-outline"
                        width={20}
                        sx={{ mr: 1, color: 'text.disabled' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <Field.Text
                  name="contact_phone"
                  label={t('label_contact_phone')}
                  placeholder="3001234567"
                  inputProps={{ autoComplete: 'tel', inputMode: 'tel' }}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="mdi:phone-outline"
                        width={20}
                        sx={{ mr: 1, color: 'text.disabled' }}
                      />
                    ),
                  }}
                />
              </Grid>

              {groups?.length > 0 && (
                <Grid xs={12} sm={6}>
                  <Field.Select name="group_id" label={t('label_group')}>
                    <MenuItem value="">{t('label_no_group')}</MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
              )}
            </Grid>
          </FormSection>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel')}
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            startIcon={
              <Iconify icon={isEdit ? 'eva:checkmark-circle-2-fill' : 'mingcute:add-line'} />
            }
          >
            {isEdit ? t('label_save_changes') : t('label_register_team')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function FormSection({ number, title, children }) {
  return (
    <Card
      sx={{
        mb: 2.5,
        p: 3,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        boxShadow: 'none',
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
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
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
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
        <Box
          sx={{
            flex: 1,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          }}
        />
      </Stack>
      {children}
    </Card>
  );
}
