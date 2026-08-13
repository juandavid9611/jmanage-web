import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

const COMMUNITY_COLORS = ['warning', 'info', 'success', 'secondary'];

function getDonorInitials(donorName) {
  const nameParts = donorName?.trim().split(/\s+/).filter(Boolean);

  if (!nameParts?.length) return '';

  const initials =
    nameParts.length === 1
      ? nameParts[0][0]
      : `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;

  return initials.toUpperCase();
}

function CommunityContributionCard({ contribution, index, expanded, onToggle }) {
  const { t } = useTranslation();
  const hasMessage = Boolean(contribution.message?.trim());
  const donorName = contribution.donorName || t('donations_anonymous');
  const initials = getDonorInitials(contribution.donorName);
  const color = COMMUNITY_COLORS[index % COMMUNITY_COLORS.length];

  return (
    <Card
      component={hasMessage ? ButtonBase : 'article'}
      onClick={hasMessage ? onToggle : undefined}
      aria-expanded={hasMessage ? expanded : undefined}
      aria-label={
        hasMessage
          ? t(expanded ? 'donations_hide_donor_message' : 'donations_read_donor_message', {
              name: donorName,
            })
          : undefined
      }
      sx={{
        p: 0,
        width: 1,
        display: 'block',
        overflow: 'hidden',
        textAlign: 'left',
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        border: (theme) => `solid 1px ${theme.palette.divider}`,
        boxShadow: (theme) => `0 8px 24px -16px ${theme.palette.grey[500]}`,
        transition: (theme) =>
          theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: `${color}.main`,
          boxShadow: (theme) => `0 18px 36px -20px ${theme.palette.grey[600]}`,
          '& .donation-heart': { transform: 'scale(1.16) rotate(-8deg)' },
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            display: 'grid',
            flexShrink: 0,
            placeItems: 'center',
            borderRadius: '50%',
            color: `${color}.darker`,
            bgcolor: `${color}.lighter`,
            typography: 'subtitle1',
          }}
        >
          {initials || (
            <Iconify
              className="donation-heart"
              icon="solar:heart-bold-duotone"
              width={25}
              sx={{ transition: (theme) => theme.transitions.create('transform') }}
            />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography variant="subtitle1" noWrap>
            {donorName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {hasMessage
              ? t(expanded ? 'donations_hide_message' : 'donations_read_message')
              : t('donations_community_member')}
          </Typography>
        </Box>

        {hasMessage && (
          <Box
            sx={{
              width: 36,
              height: 36,
              display: 'grid',
              flexShrink: 0,
              placeItems: 'center',
              borderRadius: '50%',
              color: `${color}.dark`,
              bgcolor: `${color}.lighter`,
            }}
          >
            <Iconify
              icon="eva:chevron-down-fill"
              width={20}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: (theme) => theme.transitions.create('transform'),
              }}
            />
          </Box>
        )}
      </Stack>

      {hasMessage && (
        <Collapse in={expanded} timeout="auto">
          <Box
            sx={{
              px: 2.5,
              pb: 2.5,
              ml: { xs: 0, sm: 8.5 },
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                color: 'text.secondary',
                bgcolor: `${color}.lighter`,
              }}
            >
              <Iconify
                icon="solar:quote-up-square-bold-duotone"
                width={22}
                sx={{ mb: 0.75, color: `${color}.dark` }}
              />
              <Typography variant="body2">{contribution.message}</Typography>
            </Box>
          </Box>
        </Collapse>
      )}
    </Card>
  );
}

export function DonationContributionsList({ contributions, loading, showAmounts = true }) {
  const { t } = useTranslation();
  const [expandedContributionId, setExpandedContributionId] = useState(null);

  if (loading) {
    return (
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (contributions.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
        <Iconify
          icon="solar:hand-heart-bold-duotone"
          width={48}
          sx={{ mb: 1.5, color: 'warning.main' }}
        />
        <Typography variant="body1">{t('donations_none_yet')}</Typography>
      </Card>
    );
  }

  if (!showAmounts) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        {contributions.map((contribution, index) => (
          <CommunityContributionCard
            key={contribution.id}
            contribution={contribution}
            index={index}
            expanded={expandedContributionId === contribution.id}
            onToggle={() =>
              setExpandedContributionId((currentId) =>
                currentId === contribution.id ? null : contribution.id
              )
            }
          />
        ))}
      </Box>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden', borderRadius: 2.5 }}>
      <Stack
        divider={<Box sx={{ borderBottom: (theme) => `dashed 1px ${theme.palette.divider}` }} />}
      >
        {contributions.map((contribution) => (
          <Stack
            key={contribution.id}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2.5, gap: 2, alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  flexShrink: 0,
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'warning.dark',
                  bgcolor: 'warning.lighter',
                }}
              >
                <Iconify icon="solar:heart-bold-duotone" width={22} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">
                  {contribution.donorName || t('donations_anonymous')}
                </Typography>
                {contribution.message && (
                  <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                    {contribution.message}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{ pl: { xs: 7, sm: 0 }, color: 'success.dark', whiteSpace: 'nowrap' }}
            >
              {fCurrency(contribution.amountCop, { currency: 'COP' })}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
