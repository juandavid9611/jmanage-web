import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function getReviewSchema(t) {
  return zod.object({
    rating: zod.number().min(1, t('label_rating_min_1')),
    name: zod.string().min(1, { message: t('name_required') }),
    review: zod.string().min(1, { message: t('label_review_required') }),
    email: zod
      .string()
      .min(1, { message: t('email_required') })
      .email({ message: t('email_invalid') }),
  });
}

// ----------------------------------------------------------------------

export function ProductReviewNewForm({ onClose, ...other }) {
  const { t } = useTranslation();
  const defaultValues = {
    rating: 0,
    review: '',
    name: '',
    email: '',
  };

  const ReviewSchema = useMemo(() => getReviewSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ReviewSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      onClose();
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const onCancel = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  return (
    <Dialog onClose={onClose} {...other}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle> {t('label_add_review')} </DialogTitle>

        <DialogContent>
          <div>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('label_your_review_about_product')}
            </Typography>
            <Field.Rating name="rating" />
          </div>

          <Field.Text
            name="review"
            label={t('label_review_star')}
            multiline
            rows={3}
            sx={{ mt: 3 }}
          />

          <Field.Text name="name" label={t('label_name_star')} sx={{ mt: 3 }} />

          <Field.Text name="email" label={t('label_email_star')} sx={{ mt: 3 }} />
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            {t('cancel')}
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {t('label_post')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
