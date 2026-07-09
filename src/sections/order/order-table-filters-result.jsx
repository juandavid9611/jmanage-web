import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import { ORDER_STATUS_OPTIONS } from './order-status';

// ----------------------------------------------------------------------

const OPS_LABELS = {
  pendingProvider: 'label_ops_pending_provider',
  pendingDelivery: 'label_ops_pending_delivery',
  bothDone: 'label_ops_both_done',
};

export function OrderTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const { t } = useTranslation();
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveOps = useCallback(() => {
    onResetPage();
    filters.setState({ ops: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ startDate: null, endDate: null });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label={t('filter_label_status')} isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={t(
            ORDER_STATUS_OPTIONS.find((option) => option.value === filters.state.status)?.label ||
              filters.state.status
          )}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock
        label={t('label_operation')}
        isShow={Boolean(filters.state.ops) && filters.state.ops !== 'all'}
      >
        <Chip
          {...chipProps}
          label={
            OPS_LABELS[filters.state.ops] ? t(OPS_LABELS[filters.state.ops]) : filters.state.ops
          }
          onDelete={handleRemoveOps}
        />
      </FiltersBlock>

      <FiltersBlock
        label={t('filter_label_date')}
        isShow={Boolean(filters.state.startDate && filters.state.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.startDate, filters.state.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label={t('filter_label_keyword')} isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
