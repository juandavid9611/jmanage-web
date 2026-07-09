import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

function checkTooltip(check, fallback) {
  if (!check?.checkedAt) return fallback;
  const by = check.checkedBy ? ` · ${check.checkedBy}` : '';
  return `${fDateTime(check.checkedAt)}${by}`;
}

function CheckButton({ icon, label, check, onToggle, fallbackTooltip }) {
  const isOn = Boolean(check?.checked);
  return (
    <Tooltip title={checkTooltip(check, fallbackTooltip)} placement="top" arrow>
      <Button
        size="medium"
        color={isOn ? 'success' : 'inherit'}
        variant={isOn ? 'soft' : 'outlined'}
        startIcon={<Iconify icon={icon} />}
        endIcon={
          <Iconify
            icon={isOn ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-outline'}
            sx={{ opacity: isOn ? 1 : 0.5 }}
          />
        }
        onClick={() => onToggle?.(!isOn)}
        aria-pressed={isOn}
      >
        {label}
      </Button>
    </Tooltip>
  );
}

export function OrderDetailsToolbar({
  status,
  backLink,
  createdAt,
  orderNumber,
  statusOptions,
  onChangeStatus,
  providerCheck,
  deliveryCheck,
  onToggleProviderCheck,
  onToggleDeliveryCheck,
}) {
  const { t } = useTranslation();
  const popover = usePopover();

  const statusLabel = statusOptions.find((option) => option.value === status)?.label;

  return (
    <>
      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} sx={{ mb: { xs: 3, md: 5 } }}>
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <IconButton component={RouterLink} href={backLink}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Stack spacing={0.5}>
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography variant="h4">
                {' '}
                {t('order')} {orderNumber}{' '}
              </Typography>
              <Label
                variant="soft"
                color={
                  (status === 'completed' && 'success') ||
                  (status === 'pending' && 'warning') ||
                  (status === 'cancelled' && 'error') ||
                  'default'
                }
              >
                {statusLabel ? t(statusLabel) : status}
              </Label>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {fDateTime(createdAt)}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          flexGrow={1}
          spacing={1.5}
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          flexWrap="wrap"
        >
          <CheckButton
            icon="solar:bag-check-bold"
            label={t('label_ordered_from_provider')}
            check={providerCheck}
            onToggle={onToggleProviderCheck}
            fallbackTooltip={t('label_check_provider_order_done')}
          />

          <CheckButton
            icon="solar:delivery-bold"
            label={t('label_delivered')}
            check={deliveryCheck}
            onToggle={onToggleDeliveryCheck}
            fallbackTooltip={t('label_check_delivered_to_customer')}
          />

          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

          <Button
            color="inherit"
            variant="outlined"
            endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
            onClick={popover.onOpen}
            sx={{ textTransform: 'capitalize' }}
          >
            {statusLabel ? t(statusLabel) : status}
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          >
            {t('print')}
          </Button>

          <Button color="inherit" variant="contained" startIcon={<Iconify icon="solar:pen-bold" />}>
            {t('edit')}
          </Button>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === status}
              onClick={() => {
                popover.onClose();
                onChangeStatus(option.value);
              }}
            >
              {t(option.label)}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
