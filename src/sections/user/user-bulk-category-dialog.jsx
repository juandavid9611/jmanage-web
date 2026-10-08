import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { bulkUpdateMemberships } from 'src/actions/memberships';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const ROLE_OPTIONS = ['admin', 'user', 'team_owner', 'coach'];
const KNOWN_ERRORS = ['last_membership', 'user_not_found', 'internal_error'];

/**
 * Bulk "assign selected users to a category" dialog.
 * `sourceWorkspaceId` is the category the list is currently scoped to (if any);
 * it enables the "move" checkbox.
 */
export function UserBulkCategoryDialog({
  open,
  onClose,
  onDone,
  userIds,
  usersById,
  workspaces,
  sourceWorkspaceId,
}) {
  const { t } = useTranslation();

  const [workspaceId, setWorkspaceId] = useState('');
  const [role, setRole] = useState('user');
  const [move, setMove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState([]);

  const targets = workspaces.filter((ws) => ws.id !== sourceWorkspaceId);

  const handleClose = () => {
    if (busy) return;
    const hadFailures = failures.length > 0;
    setFailures([]);
    setWorkspaceId('');
    setMove(false);
    onClose();
    if (hadFailures) onDone?.();
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const useMove = move && !!sourceWorkspaceId;
      const res = await bulkUpdateMemberships({
        userIds,
        workspaceId,
        role,
        mode: useMove ? 'move' : 'add',
        fromWorkspaceId: useMove ? sourceWorkspaceId : undefined,
      });

      const parts = [];
      if (res.created) parts.push(t('bulk_toast_assigned', { n: res.created }));
      if (res.moved) parts.push(t('bulk_toast_moved', { n: res.moved }));
      if (res.skipped) parts.push(t('bulk_toast_skipped', { n: res.skipped }));
      if (res.failed) parts.push(t('bulk_toast_failed', { n: res.failed }));
      const message = parts.length ? parts.join(', ') : t('bulk_nothing_to_do');

      if (res.failed) {
        toast.warning(message);
        setFailures(res.results.filter((r) => !r.ok));
      } else {
        toast.success(message);
        setWorkspaceId('');
        setMove(false);
        onClose();
        onDone?.(res);
      }
    } catch (err) {
      toast.error(err?.detail || t('something_went_wrong'));
    } finally {
      setBusy(false);
    }
  };

  const showFailures = failures.length > 0;

  return (
    <Dialog fullWidth open={open} onClose={handleClose} PaperProps={{ sx: { maxWidth: 480 } }}>
      <DialogTitle>{t('assign_users_count', { count: userIds.length })}</DialogTitle>

      <DialogContent dividers>
        {showFailures ? (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('bulk_failures_title')}</Typography>
            {failures.map((f) => (
              <Stack key={f.userId} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" noWrap>
                  {usersById.get(f.userId)?.name || f.userId}
                </Typography>
                <Typography variant="body2" sx={{ color: 'error.main', flexShrink: 0 }}>
                  {KNOWN_ERRORS.includes(f.error)
                    ? t(`bulk_err_${f.error}`)
                    : t('bulk_err_unknown')}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label={t('bulk_target_category')}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            >
              {targets.map((ws) => (
                <MenuItem key={ws.id} value={ws.id}>
                  {ws.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label={t('role')}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(option)}
                </MenuItem>
              ))}
            </TextField>

            {sourceWorkspaceId && (
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={move} onChange={(e) => setMove(e.target.checked)} />}
                  label={t('bulk_move_from_current')}
                />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="soft" onClick={handleClose} disabled={busy}>
          {showFailures ? t('close') : t('cancel')}
        </Button>

        {!showFailures && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!workspaceId || busy}
          >
            {t('bulk_assign_action')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
