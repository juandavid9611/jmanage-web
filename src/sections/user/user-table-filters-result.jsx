import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function UserTableFiltersResult({ filters, onResetPage, totalResults, sx }) {
  const { t } = useTranslation();
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveGroup = useCallback(
    (inputValue) => {
      const newValue = filters.state.group.filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ group: newValue });
    },
    [filters, onResetPage]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label={t('filter_label_status')} isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={t(filters.state.status)}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label={t('filter_label_group')} isShow={!!filters.state.group.length}>
        {filters.state.group.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveGroup(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('filter_label_keyword')} isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
