import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { hasSalePrice } from 'src/utils/product-price';

import {
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS_ES,
} from 'src/_mock';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} from 'src/actions/product';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// "colors" is kept as the field/payload key for API compatibility, but for this club store
// it means jersey version (Local/Visitante), not an actual color — see PR notes for the
// follow-up needed on the shop-facing swatch displays (product card, filters, detail page)
// that still render this field as a color dot and would need a text-based variant instead.
const JERSEY_LOCATION_OPTIONS = [
  { value: 'Local', label: 'Local' },
  { value: 'Visitante', label: 'Visitante' },
];

export function getNewProductSchema(t) {
  return zod
    .object({
      name: zod.string().min(1, { message: t('name_required') }),
      description: schemaHelper.editor({
        message: { required_error: t('description_required') },
      }),
      images: schemaHelper.files({ message: { required_error: t('label_images_required') } }),
      code: zod.string().min(1, { message: t('label_product_code_required') }),
      quantity: zod
        .number({ invalid_type_error: t('label_quantity_required') })
        .int()
        .min(0, { message: t('label_quantity_not_negative') }),
      available: zod
        .number()
        .int()
        .min(0, { message: t('label_quantity_not_negative') }),
      colors: zod
        .string()
        .array()
        .nonempty({ message: t('label_choose_at_least_one_option') }),
      sizes: zod
        .string()
        .array()
        .nonempty({ message: t('label_choose_at_least_one_option') }),
      gender: zod
        .string()
        .array()
        .nonempty({ message: t('label_choose_at_least_one_option') }),
      price: zod.number().min(1, { message: t('label_price_not_zero') }),
      // Not required. priceSale 0 / empty means "no discount" and is never sent to the API.
      category: zod.string(),
      priceSale: zod.number().min(0),
      subDescription: zod.string(),
      taxes: zod.number().min(0, { message: t('label_taxes_not_negative') }),
      isPublished: zod.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.priceSale > 0 && data.priceSale >= data.price) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['priceSale'],
          message: t('label_sale_price_lower'),
        });
      }
    });
}

// Body for POST/PUT /products. Contract: `available` is the sellable stock (= quantity on
// create); `priceSale` is sent only when it is a real discount, and cleared with an explicit
// null on edit when the product had one and the field was emptied. The sale label is derived
// by the API from priceSale, so it is not sent.
function buildProductPayload(data, currentProduct) {
  const payload = {
    name: data.name.trim(),
    category: data.category,
    price: data.price,
    quantity: data.quantity,
    available: currentProduct ? data.available : data.quantity,
    taxes: data.taxes,
    publish: data.isPublished ? 'published' : 'draft',
    code: data.code,
    // sku/tags/newLabel dropped from the form (not relevant for this club store); kept in the
    // payload with safe defaults in case the API still expects the keys.
    sku: currentProduct?.sku || data.code,
    description: data.description,
    subDescription: data.subDescription,
    gender: data.gender,
    tags: currentProduct?.tags || [],
    colors: data.colors,
    sizes: data.sizes,
    newLabel: currentProduct?.newLabel || { enabled: false, content: '' },
    images: data.images,
  };

  if (data.priceSale > 0) {
    payload.priceSale = data.priceSale;
  } else if (currentProduct?.priceSale != null) {
    payload.priceSale = null;
  }

  return payload;
}

// ----------------------------------------------------------------------

export function ProductNewEditForm({ currentProduct }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [includeTaxes, setIncludeTaxes] = useState(false);
  // Set when the product was created but its images failed to upload (create is not atomic).
  const [orphan, setOrphan] = useState(null);
  const [orphanBusy, setOrphanBusy] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      subDescription: currentProduct?.subDescription || '',
      images: currentProduct?.images || [],
      //
      code: currentProduct?.code || '',
      price: currentProduct?.price || 0,
      quantity: currentProduct?.quantity || 0,
      available: currentProduct?.available ?? 0,
      priceSale: currentProduct && hasSalePrice(currentProduct) ? currentProduct.priceSale : 0,
      isPublished: currentProduct ? currentProduct.publish !== 'draft' : true,
      taxes: currentProduct?.taxes || 0,
      gender: currentProduct?.gender || [],
      category: currentProduct?.category || PRODUCT_CATEGORY_OPTIONS_ES[0],
      colors: currentProduct?.colors || [],
      sizes: currentProduct?.sizes || [],
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
    const payload = buildProductPayload(data, currentProduct);

    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, payload, currentProduct.images || []);
        toast.success(t('update_success'));
      } else {
        await createProduct(payload);
        toast.success(t('create_success'));
      }
    } catch (error) {
      if (error.imageUploadFailed) {
        setOrphan({ product: error.product, files: data.images });
        toast.error(t('label_product_images_upload_failed'));
      } else {
        toast.error(error.message || t('label_product_save_failed'));
      }
      return;
    }

    router.push(paths.dashboard.product.root);
  });

  const handleRetryImages = useCallback(async () => {
    setOrphanBusy(true);
    try {
      await uploadProductImages(orphan.product.id, orphan.files);
      toast.success(t('create_success'));
      router.push(paths.dashboard.product.root);
    } catch (error) {
      toast.error(error.message || t('label_product_images_upload_failed'));
    } finally {
      setOrphanBusy(false);
    }
  }, [orphan, router, t]);

  const handleDeleteOrphan = useCallback(async () => {
    setOrphanBusy(true);
    try {
      await deleteProduct(orphan.product.id);
      setOrphan(null);
      toast.success(t('delete_success'));
    } catch (error) {
      toast.error(error.message || t('label_failed_to_delete_product'));
    } finally {
      setOrphanBusy(false);
    }
  }, [orphan, t]);

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
            accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] }}
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

          <Field.Text
            name="quantity"
            label={t('word_quantity')}
            placeholder="0"
            type="number"
            InputLabelProps={{ shrink: true }}
          />

          {currentProduct && (
            <Field.Text
              name="available"
              label={t('label_available')}
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
            />
          )}

          <Field.Select
            native
            name="category"
            label={t('category')}
            InputLabelProps={{ shrink: true }}
          >
            {PRODUCT_CATEGORY_OPTIONS_ES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Field.Select>

          <Field.MultiSelect
            checkbox
            name="colors"
            label={t('label_jersey_location')}
            options={JERSEY_LOCATION_OPTIONS}
          />

          <Field.MultiSelect
            checkbox
            name="sizes"
            label={t('label_sizes')}
            options={PRODUCT_SIZE_OPTIONS}
          />
        </Box>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t('label_gender')}</Typography>
          <Field.MultiCheckbox row name="gender" options={PRODUCT_GENDER_OPTIONS} sx={{ gap: 2 }} />
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
          helperText={t('label_sale_price_helper')}
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

  const renderOrphan = !!orphan && (
    <Alert severity="error">
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {t('label_product_images_upload_failed')}
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('label_product_images_upload_failed_desc')}
      </Typography>

      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <LoadingButton
          size="small"
          variant="contained"
          loading={orphanBusy}
          onClick={handleRetryImages}
        >
          {t('label_retry_image_upload')}
        </LoadingButton>

        <Button
          size="small"
          color="error"
          variant="soft"
          disabled={orphanBusy}
          onClick={handleDeleteOrphan}
        >
          {t('label_delete_product')}
        </Button>
      </Stack>
    </Alert>
  );

  const renderActions = (
    <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
      <Field.Switch name="isPublished" label={t('label_publish')} sx={{ pl: 3, flexGrow: 1 }} />

      <LoadingButton
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
        disabled={!!orphan}
      >
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

        {renderOrphan}

        {renderActions}
      </Stack>
    </Form>
  );
}
