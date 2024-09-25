import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import MenuItem from '@mui/material/MenuItem';
import {
  Box,
  Chip,
  Grid,
  Avatar,
  Divider,
  Container,
  Typography,
  CardHeader,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { today, fIsAfter, fDateTime } from 'src/utils/format-time';

import { TEAM_GROUPS } from 'src/_mock';
import { useGetUsers } from 'src/actions/user';
import { uploadFileToS3 } from 'src/actions/files';
import {
  updatePaymentRequest,
  createPaymentRequests,
  generatePresignedUrls,
  requestPaymentRequestApproval,
} from 'src/actions/paymentRequest';

import { Image } from 'src/components/image';
import { toast } from 'src/components/snackbar';
import { Lightbox, useLightBox } from 'src/components/lightbox';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceNewEditStatusDate } from './invoice-new-edit-status-date';

export const NewInvoiceSchema = zod
  .object({
    concept: zod.string().min(1, { message: 'Concept is required!' }),
    description: zod.string().min(1, { message: 'Description is required!' }),
    createDate: schemaHelper.date({ message: { required_error: 'Create date is required!' } }),
    dueDate: schemaHelper.date({ message: { required_error: 'Due date is required!' } }),
    status: zod.string().min(1, { message: 'Status is required!' }),
    category: zod.string().min(1, { message: 'Category is required!' }),
    group: zod.string().min(1, { message: 'Group is required!' }),
    paymentRequestTo: zod.any().array().min(1, { message: 'Payment request to is required!' }),
    userPrice: zod.number().min(1, { message: 'User price must be more than 0' }),
    overduePrice: zod.number(),
    sponsorPrice: zod.number(),
    sponsorPercentage: zod.number(),
  })
  .refine((data) => !fIsAfter(data.createDate, data.dueDate), {
    message: 'Due date cannot be earlier than create date!',
    path: ['dueDate'],
  });

// ----------------------------------------------------------------------

export function InvoiceNewEditForm({ currentInvoice }) {
  const { t } = useTranslation();
  const router = useRouter();

  const slides = currentInvoice?.images?.map((slide) => ({ src: slide })) || [];
  const {
    selected: selectedImage,
    open: openLightbox,
    onOpen: handleOpenLightbox,
    onClose: handleCloseLightbox,
  } = useLightBox(slides);

  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  const isUser = !isAdmin;

  const defaultValues = useMemo(
    () => ({
      concept: currentInvoice?.concept || '',
      description: currentInvoice?.description || '',
      id: currentInvoice?.id || null,
      createDate: currentInvoice?.createDate || today(),
      dueDate: currentInvoice?.dueDate || null,
      status: currentInvoice?.status || 'pending',
      category: currentInvoice?.category || 'Entrenos',
      paymentRequestTo: currentInvoice?.paymentRequestTo ? [currentInvoice.paymentRequestTo] : [],
      group: currentInvoice?.group || 'male',
      userPrice: currentInvoice?.totalAmount || 0,
      overduePrice: currentInvoice?.overduePrice || 0,
      sponsorPrice: currentInvoice?.sponsorPrice || 0,
      sponsorPercentage: currentInvoice?.sponsorPercentage || 0,
      images: currentInvoice?.images || [],
    }),
    [currentInvoice]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const { users } = useGetUsers();

  const onSubmit = handleSubmit(async (data) => {
    data.createDate = fDateTime(data?.createDate, 'YYYY-MM-DDTHH:mm:ss');
    data.dueDate = fDateTime(data?.dueDate, 'YYYY-MM-DDTHH:mm:ss');

    try {
      if (currentInvoice) {
        await updatePaymentRequest(currentInvoice.id, data);
        toast.success('Update success!');
      } else {
        await createPaymentRequests(data);
        toast.success('Create success!');
      }
    } catch (error) {
      toast.error(error.message);
    }
    router.push(paths.dashboard.admin.invoice.root);
  });

  const handleUploadFiles = useCallback(
    async (event) => {
      // Step 4: Wait for all uploads to complete
      try {
        // Step 2: Request pre-signed URLs for each file from the backend
        const response = await generatePresignedUrls(values.id, values.images);

        // Step 3: Upload each file to its respective pre-signed URL
        const uploadPromises = values.images.map((file) => {
          const presignedUrl = response.urls[file.name];
          return uploadFileToS3(file, presignedUrl);
        });
        const file_names = values.images.map((file) => file.name);
        const allPromises = Promise.all(uploadPromises);
        toast.promise(allPromises, {
          loading: 'Loading...',
          success: () => 'All files uploaded successfully',
          error: 'File upload failed',
        });
        await requestPaymentRequestApproval(values.id, file_names);
        router.push(paths.dashboard.user.invoice.invoiceList);
      } catch (error) {
        console.error('File upload failed', error);
      }
    },
    [values.images, values.id, router]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.images && values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered);
    },
    [setValue, values.images]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', [], { shouldValidate: true });
  }, [setValue]);

  const renderGallery = currentInvoice?.images.length > 0 && (
    <>
      <Box
        gap={1}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Image
          alt={slides[0].src}
          src={slides[0].src}
          ratio="1/1"
          onClick={() => handleOpenLightbox(slides[0].src)}
          sx={{
            borderRadius: 2,
            cursor: 'pointer',
            transition: (theme) => theme.transitions.create('opacity'),
            '&:hover': { opacity: 0.8 },
          }}
        />

        <Box gap={1} display="grid" gridTemplateColumns="repeat(2, 1fr)">
          {slides.slice(1, 5).map((slide) => (
            <Image
              key={slide.src}
              alt={slide.src}
              src={slide.src}
              ratio="1/1"
              onClick={() => handleOpenLightbox(slide.src)}
              sx={{
                borderRadius: 2,
                cursor: 'pointer',
                transition: (theme) => theme.transitions.create('opacity'),
                '&:hover': { opacity: 0.8 },
              }}
            />
          ))}
        </Box>
      </Box>

      <Lightbox
        index={selectedImage}
        slides={slides}
        open={openLightbox}
        close={handleCloseLightbox}
      />
    </>
  );

  return (
    <Container sx={{ mt: 5, mb: 10 }}>
      <Form methods={methods}>
        <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 990 } }}>
          <Card>
            <InvoiceNewEditStatusDate disableFields={isUser} />
            <Stack spacing={3} sx={{ p: 3 }}>
              <Box
                columnGap={2}
                rowGap={3}
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
              >
                <Field.Text name="concept" label={t('concept')} disabled={isUser} />

                <Field.Text name="description" label={t('description')} disabled={isUser} />

                <Field.Select
                  name="category"
                  label={t('category')}
                  InputLabelProps={{ shrink: true }}
                  disabled={isUser}
                >
                  {['Entrenos', 'Sansiones', 'Indumentarias', 'Torneos'].map((category) => (
                    <MenuItem key={category} value={category} sx={{ textTransform: 'capitalize' }}>
                      {t(category)}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Select
                  name="group"
                  label={t('group')}
                  InputLabelProps={{ shrink: true }}
                  disabled={isUser}
                >
                  {TEAM_GROUPS.map((option) => (
                    <MenuItem
                      key={option.label}
                      value={option.value}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {t(option.label)}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>

              {!currentInvoice ? (
                <Field.Autocomplete
                  multiple
                  name="paymentRequestTo"
                  placeholder={`${t('users')}...`}
                  disableCloseOnSelect
                  options={users.filter((option) => option.group === values?.group)}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderOption={(props, paymentRequestTo) => (
                    <li {...props} key={paymentRequestTo.id}>
                      <Avatar
                        key={paymentRequestTo.id}
                        alt={paymentRequestTo.avatarUrl}
                        src={paymentRequestTo.avatarUrl}
                        sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                      />

                      {paymentRequestTo.name}
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((paymentRequestTo, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={paymentRequestTo.id}
                        size="small"
                        variant="soft"
                        label={paymentRequestTo.name}
                        avatar={
                          <Avatar alt={paymentRequestTo.name} src={paymentRequestTo.avatarUrl} />
                        }
                      />
                    ))
                  }
                />
              ) : (
                <Field.Text
                  disabled
                  name="paymentRequestTo"
                  label={t('user')}
                  value={currentInvoice?.paymentRequestTo?.name || ''}
                />
              )}

              <Stack spacing={1}>
                <Typography variant="subtitle2">{t('price')}</Typography>
                <Field.MultiCheckbox row name="gender" options={[]} sx={{ gap: 2 }} />
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Field.Text
                name="userPrice"
                label={t('regular_price')}
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        $
                      </Box>
                    </InputAdornment>
                  ),
                }}
                disabled={isUser}
              />

              <Field.Text
                name="overduePrice"
                label={t('overdue_price')}
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        $
                      </Box>
                    </InputAdornment>
                  ),
                }}
                disabled={isUser}
              />
            </Stack>

            {!isUser && (
              <Stack justifyContent="flex-end" direction="row" sx={{ pb: 2, px: 2 }}>
                <LoadingButton
                  size="large"
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  onClick={onSubmit}
                >
                  {currentInvoice ? t('update') : t('create')} & {t('send')}
                </LoadingButton>
              </Stack>
            )}
          </Card>

          {currentInvoice && (
            <Card>
              <CardHeader
                title={t('payment')}
                subheader={t('add_your_payment_vouchers')}
                sx={{ mb: 3 }}
              />

              <Divider />
              <Stack spacing={3} sx={{ p: 3 }}>
                <Typography variant="subtitle2">{t('images')}</Typography>
                {currentInvoice?.images.length > 0 ? (
                  <Grid container>
                    <Grid sx={{ mx: 'auto' }}>{renderGallery}</Grid>
                  </Grid>
                ) : (
                  <Field.Upload
                    multiple
                    thumbnail
                    name="images"
                    maxSize={3145728}
                    onRemove={handleRemoveFile}
                    onRemoveAll={handleRemoveAllFiles}
                    onUpload={handleUploadFiles}
                  />
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </Form>
    </Container>
  );
}
