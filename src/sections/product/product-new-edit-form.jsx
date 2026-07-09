import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createProduct, updateProduct } from 'src/actions/product';
import {
  _tags,
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_COLOR_NAME_OPTIONS,
  PRODUCT_CATEGORY_GROUP_OPTIONS,
} from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function getNewProductSchema(t) {
  return zod.object({
    name: zod.string().min(1, { message: t('name_required') }),
    description: schemaHelper.editor({
      message: { required_error: t('description_required') },
    }),
    images: schemaHelper.files({ message: { required_error: t('label_images_required') } }),
    code: zod.string().min(1, { message: t('label_product_code_required') }),
    sku: zod.string().min(1, { message: t('label_product_sku_required') }),
    quantity: zod.number().min(1, { message: t('label_quantity_required') }),
    colors: zod
      .string()
      .array()
      .nonempty({ message: t('label_choose_at_least_one_option') }),
    sizes: zod
      .string()
      .array()
      .nonempty({ message: t('label_choose_at_least_one_option') }),
    tags: zod
      .string()
      .array()
      .min(2, { message: t('label_must_have_at_least_2_items') }),
    gender: zod
      .string()
      .array()
      .nonempty({ message: t('label_choose_at_least_one_option') }),
    price: zod.number().min(1, { message: t('label_price_not_zero') }),
    // Not required
    category: zod.string(),
    priceSale: zod.number(),
    subDescription: zod.string(),
    taxes: zod.number(),
    saleLabel: zod.object({ enabled: zod.boolean(), content: zod.string() }),
    newLabel: zod.object({ enabled: zod.boolean(), content: zod.string() }),
  });
}

// ----------------------------------------------------------------------

export function ProductNewEditForm({ currentProduct }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      subDescription: currentProduct?.subDescription || '',
      images: currentProduct?.images || [],
      //
      code: currentProduct?.code || '',
      sku: currentProduct?.sku || '',
      price: currentProduct?.price || 0,
      quantity: currentProduct?.quantity || 0,
      priceSale: currentProduct?.priceSale || 0,
      tags: currentProduct?.tags || [],
      taxes: currentProduct?.taxes || 0,
      gender: currentProduct?.gender || [],
      category: currentProduct?.category || PRODUCT_CATEGORY_GROUP_OPTIONS[0].classify[1],
      colors: currentProduct?.colors || [],
      sizes: currentProduct?.sizes || [],
      newLabel: currentProduct?.newLabel || { enabled: false, content: '' },
      saleLabel: currentProduct?.saleLabel || { enabled: false, content: '' },
    }),
    [currentProduct]
  );

  const NewProductSchema = useMemo(() => getNewProductSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(NewProductSchema),
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

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);
    }
  }, [currentProduct, defaultValues, reset]);

  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentProduct?.taxes || 0);
    }
  }, [currentProduct?.taxes, includeTaxes, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, data);
        toast.success(t('update_success'));
      } else {
        await createProduct(data);
        toast.success(t('create_success'));
      }
    } catch (error) {
      toast.error(error.message);
    }
    reset();
    router.push(paths.dashboard.product.root);
    console.info('DATA', data);
  });

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

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  const handleUpload = useCallback(() => {
    setUploadingImages(true);
    toast.info(t('label_images_uploaded_on_save'));
    // Images are uploaded during form submission in onSubmit
    setUploadingImages(false);
  }, [t]);

  const renderDetails = (
    <Card>
      <CardHeader
        title={t('details')}
        subheader={t('label_title_short_description_image')}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="name" label={t('label_product_name')} />

        <Field.Text name="subDescription" label={t('label_sub_description')} multiline rows={4} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('label_content')}</Typography>
          <Field.Editor name="description" sx={{ maxHeight: 480 }} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('images')}</Typography>
          <Field.Upload
            multiple
            thumbnail
            name="images"
            maxSize={3145728}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            onUpload={handleUpload}
          />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = (
    <Card>
      <CardHeader
        title={t('label_properties')}
        subheader={t('payment_request_properties')}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Box
          columnGap={2}
          rowGap={3}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
        >
          <Field.Text name="code" label={t('label_product_code')} />

          <Field.Text name="sku" label={t('label_product_sku')} />

          <Field.Text
            name="quantity"
            label={t('word_quantity')}
            placeholder="0"
            type="number"
            InputLabelProps={{ shrink: true }}
          />

          <Field.Select
            native
            name="category"
            label={t('category')}
            InputLabelProps={{ shrink: true }}
          >
            {PRODUCT_CATEGORY_GROUP_OPTIONS.map((category) => (
              <optgroup key={category.group} label={category.group}>
                {category.classify.map((classify) => (
                  <option key={classify} value={classify}>
                    {classify}
                  </option>
                ))}
              </optgroup>
            ))}
          </Field.Select>

          <Field.MultiSelect
            checkbox
            name="colors"
            label={t('label_colors')}
            options={PRODUCT_COLOR_NAME_OPTIONS}
          />

          <Field.MultiSelect
            checkbox
            name="sizes"
            label={t('label_sizes')}
            options={PRODUCT_SIZE_OPTIONS}
          />
        </Box>

        <Field.Autocomplete
          name="tags"
          label={t('label_tags')}
          placeholder={t('label_plus_tags')}
          multiple
          freeSolo
          disableCloseOnSelect
          options={_tags.map((option) => option)}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t('label_gender')}</Typography>
          <Field.MultiCheckbox row name="gender" options={PRODUCT_GENDER_OPTIONS} sx={{ gap: 2 }} />
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack direction="row" alignItems="center" spacing={3}>
          <Field.Switch name="saleLabel.enabled" label={null} sx={{ m: 0 }} />
          <Field.Text
            name="saleLabel.content"
            label={t('label_sale_label')}
            fullWidth
            disabled={!values.saleLabel.enabled}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={3}>
          <Field.Switch name="newLabel.enabled" label={null} sx={{ m: 0 }} />
          <Field.Text
            name="newLabel.content"
            label={t('label_new_label')}
            fullWidth
            disabled={!values.newLabel.enabled}
          />
        </Stack>
      </Stack>
    </Card>
  );

  const renderPricing = (
    <Card>
      <CardHeader
        title={t('label_pricing')}
        subheader={t('label_price_related_inputs')}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text
          name="price"
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
        />

        <Field.Text
          name="priceSale"
          label={t('label_sale_price')}
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
        />

        <FormControlLabel
          control={
            <Switch id="toggle-taxes" checked={includeTaxes} onChange={handleChangeIncludeTaxes} />
          }
          label={t('label_price_includes_taxes')}
        />

        {!includeTaxes && (
          <Field.Text
            name="taxes"
            label={t('label_tax_percent')}
            placeholder="0.00"
            type="number"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    %
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        )}
      </Stack>
    </Card>
  );

  const renderActions = (
    <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
      <FormControlLabel
        control={<Switch defaultChecked inputProps={{ id: 'publish-switch' }} />}
        label={t('label_publish')}
        sx={{ pl: 3, flexGrow: 1 }}
      />

      <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
        {!currentProduct ? t('label_create_product') : t('save_changes')}
      </LoadingButton>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderProperties}

        {renderPricing}

        {renderActions}
      </Stack>
    </Form>
  );
}
