import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  sendTrainingSession,
  deleteTrainingSession,
  reviewTrainingSession,
  useGetTrainingSession,
} from 'src/actions/training-sessions';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { ExerciseCard } from '../exercise-card';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  draft: 'default',
  sent: 'warning',
  approved: 'success',
  rejected: 'error',
};

export function SessionDetailView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { selectedWorkspace, workspaceRole } = useWorkspace();

  const { session, sessionLoading } = useGetTrainingSession(selectedWorkspace, id);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCoach = workspaceRole === 'coach' || workspaceRole === 'admin' || workspaceRole === 'team_owner';
  const isReviewer = workspaceRole === 'admin' || workspaceRole === 'team_owner';

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    try {
      await deleteTrainingSession(id, selectedWorkspace?.id);
      toast.success(t('delete_success'));
      navigate(paths.dashboard.trainingSessions.list);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
      setDeleteDialog(false);
    }
  }, [id, selectedWorkspace?.id, navigate, t]);

  const handleSend = useCallback(async () => {
    setSubmitting(true);
    try {
      await sendTrainingSession(id, selectedWorkspace?.id);
      toast.success(t('label_session_sent'));
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }, [id, selectedWorkspace?.id, t]);

  const handleApprove = useCallback(async () => {
    setSubmitting(true);
    try {
      await reviewTrainingSession(
        id,
        { approved: true, reviewer: { id: user?.id, name: user?.displayName } },
        selectedWorkspace?.id
      );
      toast.success(t('label_session_approved'));
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }, [id, selectedWorkspace?.id, t, user]);

  const handleReject = useCallback(async () => {
    setSubmitting(true);
    try {
      await reviewTrainingSession(
        id,
        {
          approved: false,
          comment: rejectComment,
          reviewer: { id: user?.id, name: user?.displayName },
        },
        selectedWorkspace?.id
      );
      toast.success(t('label_session_rejected'));
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
      setRejectDialog(false);
      setRejectComment('');
    }
  }, [id, rejectComment, selectedWorkspace?.id, t, user]);

  if (sessionLoading) return <LoadingScreen />;

  if (!session) {
    return (
      <DashboardContent>
        <Typography variant="h6">{t('label_no_sessions')}</Typography>
      </DashboardContent>
    );
  }

  const canEdit = isCoach && (session.status === 'draft' || session.status === 'rejected');
  const canSend = canEdit;
  const canReview = isReviewer && session.status === 'sent';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={session.title}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_training_sessions'), href: paths.dashboard.trainingSessions.list },
          { name: session.title },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:pen-bold" />}
                onClick={() => navigate(paths.dashboard.trainingSessions.edit(session.id))}
              >
                {t('edit')}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => setDeleteDialog(true)}
              >
                {t('delete')}
              </Button>
            )}
            {canSend && (
              <LoadingButton
                variant="contained"
                loading={submitting}
                startIcon={<Iconify icon="iconamoon:send-fill" />}
                onClick={handleSend}
              >
                {t('label_send_to_admin')}
              </LoadingButton>
            )}
            {canReview && (
              <>
                <LoadingButton
                  variant="outlined"
                  color="error"
                  loading={submitting}
                  startIcon={<Iconify icon="solar:close-circle-bold" />}
                  onClick={() => setRejectDialog(true)}
                >
                  {t('label_reject_session')}
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  color="success"
                  loading={submitting}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                  onClick={handleApprove}
                >
                  {t('label_approve_session')}
                </LoadingButton>
              </>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Label variant="soft" color={STATUS_COLOR[session.status]}>
              {t(`status_${session.status}`)}
            </Label>
            {session.createdBy?.name && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {`${t('label_created_by')}: ${session.createdBy.name}`}
              </Typography>
            )}
          </Stack>

          <Stack spacing={1} sx={{ typography: 'body2' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:calendar-bold" width={18} />
              <span>{session.date ? fDate(session.date) : '-'}</span>
            </Stack>
            {session.location && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="mdi:map-marker-outline" width={18} />
                <span>{session.location}</span>
              </Stack>
            )}
            {session.teamGroup && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="mdi:account-group" width={18} />
                <span>{session.teamGroup}</span>
              </Stack>
            )}
            {session.objective && (
              <Typography variant="body2" sx={{ pt: 1 }}>
                {session.objective}
              </Typography>
            )}
          </Stack>

          {session.status === 'rejected' && session.reviewComment && (
            <Stack
              spacing={0.5}
              sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: (theme) => theme.palette.background.neutral }}
            >
              <Typography variant="subtitle2" color="error.main">
                {t('label_review_comment')}
              </Typography>
              <Typography variant="body2">{session.reviewComment}</Typography>
            </Stack>
          )}
        </Card>

        {session.exercises?.map((exercise, index) => (
          <ExerciseCard key={exercise.id} exercise={exercise} index={index} readOnly onChange={() => {}} />
        ))}
      </Stack>

      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        title={t('delete')}
        content={t('label_confirm_delete_session')}
        action={
          <LoadingButton variant="contained" color="error" loading={submitting} onClick={handleDelete}>
            {t('delete')}
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={rejectDialog}
        onClose={() => setRejectDialog(false)}
        title={t('label_reject_session')}
        content={
          <TextField
            fullWidth
            multiline
            rows={3}
            autoFocus
            label={t('label_review_comment')}
            value={rejectComment}
            onChange={(evt) => setRejectComment(evt.target.value)}
            sx={{ mt: 1 }}
          />
        }
        action={
          <LoadingButton variant="contained" color="error" loading={submitting} onClick={handleReject}>
            {t('label_reject_session')}
          </LoadingButton>
        }
      />
    </DashboardContent>
  );
}
