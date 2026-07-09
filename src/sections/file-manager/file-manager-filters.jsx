import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CardActionArea from '@mui/material/CardActionArea';
import InputAdornment from '@mui/material/InputAdornment';

import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

// display labels only — the underlying values are real filter-matching keys and must stay unchanged.
export const FILE_TYPE_LABEL = {
  folder: 'file_type_folder',
  txt: 'file_type_txt',
  zip: 'file_type_zip',
  audio: 'file_type_audio',
  image: 'file_type_image',
  video: 'file_type_video',
  word: 'file_type_word',
  excel: 'file_type_excel',
  powerpoint: 'file_type_powerpoint',
  pdf: 'file_type_pdf',
  photoshop: 'file_type_photoshop',
  illustrator: 'file_type_illustrator',
};

export function FileManagerFilters({ filters, options, onResetPage }) {
  const { t } = useTranslation();
  const popover = usePopover();

  const renderLabel = filters.state.type.length
    ? filters.state.type
        .slice(0, 2)
        .map((type) => t(FILE_TYPE_LABEL[type] || type))
        .join(', ')
    : t('label_all_type');

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterType = useCallback(
    (newValue) => {
      const checked = filters.state.type.includes(newValue)
        ? filters.state.type.filter((value) => value !== newValue)
        : [...filters.state.type, newValue];

      filters.setState({ type: checked });
    },
    [filters]
  );

  const handleResetType = useCallback(() => {
    popover.onClose();
    filters.setState({ type: [] });
  }, [filters, popover]);

  const renderFilterName = (
    <TextField
      value={filters.state.name}
      onChange={handleFilterName}
      placeholder={t('search')}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
          </InputAdornment>
        ),
      }}
      sx={{ width: { xs: 1, md: 260 } }}
    />
  );

  const renderFilterType = (
    <>
      <Button
        color="inherit"
        onClick={popover.onOpen}
        endIcon={
          <Iconify
            icon={popover.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            sx={{ ml: -0.5 }}
          />
        }
      >
        {renderLabel}
        {filters.state.type.length > 2 && (
          <Label color="info" sx={{ ml: 1 }}>
            +{filters.state.type.length - 2}
          </Label>
        )}
      </Button>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ paper: { sx: { p: 2.5 } } }}
      >
        <Stack spacing={2.5}>
          <Box
            gap={1}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
          >
            {options.types.map((type) => {
              const selected = filters.state.type.includes(type);

              return (
                <CardActionArea
                  key={type}
                  onClick={() => handleFilterType(type)}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: (theme) =>
                      `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
                    ...(selected && { bgcolor: 'action.selected' }),
                  }}
                >
                  <Stack
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    sx={{
                      typography: 'caption',
                      textTransform: 'capitalize',
                      ...(selected && { fontWeight: 'fontWeightSemiBold' }),
                    }}
                  >
                    <FileThumbnail file={type} sx={{ width: 24, height: 24 }} />
                    {t(FILE_TYPE_LABEL[type] || type)}
                  </Stack>
                </CardActionArea>
              );
            })}
          </Box>

          <Stack spacing={1.5} direction="row" alignItems="center" justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={handleResetType}>
              {t('label_clear')}
            </Button>

            <Button variant="contained" onClick={popover.onClose}>
              {t('label_apply')}
            </Button>
          </Stack>
        </Stack>
      </CustomPopover>
    </>
  );

  return (
    <Stack
      spacing={1}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1 }}
    >
      {renderFilterName}

      <Stack spacing={1} direction="row" alignItems="center" justifyContent="flex-end" flexGrow={1}>
        {renderFilterType}
      </Stack>
    </Stack>
  );
}
