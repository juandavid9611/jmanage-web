import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useWorkspace } from 'src/workspace/workspace-provider';
import { createExpense, updateExpense, processExpenseProofImages } from 'src/actions/expenses';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const TEAM_OPTIONS = ['masculino', 'femenino', 'master', 'general'];

const CATEGORY_OPTIONS = [
  'Cancha',
  'Entrenador',
  'Arbitraje',
  'Transporte',
  'Indumentaria',
  'Servicios',
  'Torneos',
  'Multas',
  'Otros',
];

function getExpenseSchema(t) {
  return zod.object({
    team: zod.string().min(1),
    category: zod.string().min(1, { message: t('title_required') }),
    subcategory: zod.string().optional(),
    detail: zod.string().min(1, { message: t('title_required') }),
    beneficiary_name: zod.string().optional(),
    expense_date: zod.union([zod.string(), zod.number()]),
    total_amount: zod.number().int().positive(),
    proof_images: zod.array(zod.any()).optional(),
  });
}

export function ExpenseNewEditForm({ currentExpense }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();

  const schema = useMemo(() => getExpenseSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues: {
      team: currentExpense?.team || 'general',
      category: currentExpense?.category || '',
      subcategory: currentExpense?.subcategory || '',
      detail: currentExpense?.detail || '',
      beneficiary_name: currentExpense?.beneficiary_name || '',
      expense_date: currentExpense?.expense_date
        ? dayjs(currentExpense.expense_date).valueOf()
        : dayjs().valueOf(),
      total_amount: currentExpense?.total_amount || 0,
      proof_images: currentExpense?.proof_images || [],
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  const proofImages = watch('proof_images');

  // Creating isn't atomic (create → upload comprobantes → update). If a step
  // after the create fails, the expense already exists — this remembers its
  // id so retrying the same Save click updates it instead of creating a
  // second, duplicate expense.
  const [createdId, setCreatedId] = useState(null);
  const effectiveExpense = currentExpense || (createdId ? { id: createdId } : null);

  const handleRemoveFile = useCallback(
    (inputFile) => {
      setValue(
        'proof_images',
        proofImages?.filter((file) => file !== inputFile)
      );
    },
    [proofImages, setValue]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('proof_images', [], { shouldValidate: true });
  }, [setValue]);

  const onSubmit = handleSubmit(async (data) => {
    // account_id no se manda: la API lo ignora al crear/editar — la cuenta
    // la fija el primer pago (ver ExpenseMarkPaidDialog).
    const { proof_images: images, ...rest } = data;
    const basePayload = {
      ...rest,
      expense_date: dayjs(data.expense_date).format('YYYY-MM-DD'),
    };

    try {
      let expenseId = effectiveExpense?.id;
      const isRetryOrEdit = !!expenseId;

      if (!expenseId) {
        const created = await createExpense(basePayload, selectedWorkspace?.id);
        expenseId = created.id;
        // Remembered so that if anything below fails, clicking Save again
        // retries against this same expense instead of creating another one.
        setCreatedId(expenseId);
      }

      const newFiles = images?.filter((image) => image instanceof File);
      if (isRetryOrEdit || newFiles?.length) {
        const uploadedPaths = await processExpenseProofImages(expenseId, images, selectedWorkspace?.id);
        await updateExpense(
          expenseId,
          { ...basePayload, proof_images: uploadedPaths },
          selectedWorkspace?.id
        );
      }

      toast.success(t(currentExpense ? 'update_success' : 'create_success'));
      router.push(paths.dashboard.finanzas.root);
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select name="team" label={t('label_expense_team')} sx={{ flex: 1 }}>
              {TEAM_OPTIONS.map((team) => (
                <MenuItem key={team} value={team}>
                  {t(`label_expense_team_${team}`)}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.DatePicker name="expense_date" label={t('label_expense_date')} sx={{ flex: 1 }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select name="category" label={t('label_expense_category')} sx={{ flex: 1 }}>
              {CATEGORY_OPTIONS.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text name="subcategory" label={t('label_expense_subcategory')} sx={{ flex: 1 }} />
          </Stack>

          <Field.Text name="detail" label={t('label_expense_detail')} />

          <Field.Text name="beneficiary_name" label={t('label_beneficiary')} />

          <Field.Text
            name="total_amount"
            type="number"
            label={t('label_total_amount')}
            inputProps={{ min: 0 }}
          />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('label_proof_images')}</Typography>
            <Field.Upload
              multiple
              thumbnail
              name="proof_images"
              maxSize={3145728}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
            />
          </Stack>
        </Stack>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => router.push(paths.dashboard.finanzas.root)}
        >
          {t('label_close')}
        </Button>

        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          {t(currentExpense ? 'label_save' : 'label_add_expense')}
        </LoadingButton>
      </Stack>
    </Form>
  );
}
