import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const ACCOUNT_NUMBER = '61900000397';
const TRANSFER_KEY = '319 389 8560';
const WHATSAPP_NUMBER = '573193898560';

export function DonationPaymentDetails() {
  const { t } = useTranslation();
  const { copy, copiedText } = useCopyToClipboard();
  const receiptUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('donations_receipt_message'))}`;

  const paymentDetails = [
    { label: t('donations_bank_label'), value: t('donations_bank_value'), copyValue: null },
    { label: t('donations_account_label'), value: ACCOUNT_NUMBER, copyValue: ACCOUNT_NUMBER },
    {
      label: t('donations_key_label'),
      value: TRANSFER_KEY,
      copyValue: TRANSFER_KEY.replaceAll(' ', ''),
    },
    {
      label: t('donations_holder_label'),
      value: 'Nicolle Angarita Marín',
      copyValue: 'Nicolle Angarita Marín',
    },
  ];

  return (
    <Card
      sx={{
        maxWidth: 820,
        mx: 'auto',
        overflow: 'hidden',
        borderRadius: 3,
        boxShadow: (theme) => theme.customShadows.z16,
      }}
    >
      <Box sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                color: 'warning.dark',
                bgcolor: 'warning.lighter',
              }}
            >
              <Iconify icon="solar:card-transfer-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="h5">{t('donations_transfer_title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('donations_transfer_subtitle')}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={0}>
          {paymentDetails.map((detail) => {
            const copied = detail.copyValue && copiedText === detail.copyValue;

            return (
              <Stack
                key={detail.label}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  py: 2,
                  gap: 2,
                  borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  '&:last-of-type': { borderBottom: 0 },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {detail.label}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
                    {detail.value}
                  </Typography>
                </Box>
                {detail.copyValue && (
                  <Tooltip title={copied ? t('donations_copied') : t('donations_copy')}>
                    <IconButton
                      color={copied ? 'success' : 'default'}
                      onClick={() => copy(detail.copyValue)}
                      aria-label={`${t('donations_copy')} ${detail.label}`}
                    >
                      <Iconify
                        icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'success.lighter' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify
              icon="solar:chat-round-dots-bold-duotone"
              width={28}
              sx={{ mt: 0.25, color: 'success.dark', flexShrink: 0 }}
            />
            <Box>
              <Typography variant="subtitle1">{t('donations_receipt_title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('donations_receipt_description')}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            color="success"
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Iconify icon="logos:whatsapp-icon" />}
            sx={{ flexShrink: 0 }}
          >
            {t('donations_send_receipt')}
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
