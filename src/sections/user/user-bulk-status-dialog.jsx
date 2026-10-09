import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { bulkSetUserStatus } from 'src/actions/user';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const KNOWN_ERRORS = ['self', 'last_admin', 'user_not_found', 'throttled', 'internal_error'];

/**
 * Bulk enable/disable confirmation for the selected users, backed by POST /users/bulk-status.
 * `disabled` picks the mode (true = disable, false = enable); both require confirmation since
 * enable reactivates every membership the user has in this account.
 */
export function UserBulkStatusDialog({ open, onClose, onDone, userIds, usersById, disabled }) {
  const { t } = useTranslation();

  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState([]);

  const handleClose = () => {
    if (busy) return;
    const hadFailures = failures.length > 0;
    setFailures([]);
    onClose();
    if (hadFailures) onDone?.();
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const res = await bulkSetUserStatus(userIds, disabled);

      const doneCount = disabled ? res.disabled : res.enabled;
      const parts = [];
      if (doneCount) {
        parts.push(
          t(disabled ? 'bulk_status_toast_disabled' : 'bulk_status_toast_enabled', {
            count: doneCount,
          })
        );
      }
      if (res.skipped) parts.push(t('bulk_status_toast_skipped', { count: res.skipped }));
      if (res.failed) parts.push(t('bulk_status_toast_failed', { count: res.failed }));
      const message = parts.length ? parts.join(', ') : t('bulk_nothing_to_do');

      if (res.failed) {
        toast.warning(message);
        setFailures(res.results.filter((r) => !r.ok));
      } else {
        toast.success(message);
        onClose();
        onDone?.(res);
      }
    } catch (error) {
      toast.error(error?.message || t('something_went_wrong'));
    } finally {
      setBusy(false);
    }
  };

  const showFailures = failures.length > 0;

  return (
    <Dialog fullWidth open={open} onClose={handleClose} PaperProps={{ sx: { maxWidth: 480 } }}>
      <DialogTitle>{disabled ? t('label_bulk_disable') : t('label_bulk_enable')}</DialogTitle>

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
                    ? t(`bulk_status_err_${f.error}`)
                    : t('bulk_err_unknown')}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2">
              {t(disabled ? 'label_bulk_disable_confirm' : 'label_bulk_enable_confirm', {
                count: userIds.length,
              })}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t(disabled ? 'label_bulk_disable_body' : 'label_bulk_enable_body')}
            </Typography>
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
            color={disabled ? 'warning' : 'success'}
            onClick={handleSubmit}
            disabled={busy || !userIds.length}
          >
            {disabled ? t('label_bulk_disable') : t('label_bulk_enable')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
