import { fDateRangeShortLabel } from 'src/utils/format-time';

// values below are i18n keys, resolved via t() at render time.
const MONTH_NAMES = [
  'month_jan_full',
  'month_feb_full',
  'month_mar_full',
  'month_apr_full',
  'month_may_full',
  'month_jun_full',
  'month_jul_full',
  'month_aug_full',
  'month_sep_full',
  'month_oct_full',
  'month_nov_full',
  'month_dec_full',
];

export function monthLabel(month, t) {
  if (!month) return '';
  const [year, m] = month.split('-');
  return `${t(MONTH_NAMES[parseInt(m, 10) - 1])} ${year}`;
}

export function isSemester(votation) {
  return votation?.period_type === 'semester';
}

export function periodLabel(votation, t) {
  if (isSemester(votation)) {
    const { start_date: start, end_date: end } = votation;
    return start && end ? fDateRangeShortLabel(start, end, true) : '';
  }
  return monthLabel(votation?.month, t);
}

export function playerOfPeriodLabel(votation, t) {
  return t(isSemester(votation) ? 'label_player_of_the_semester' : 'label_player_of_the_month');
}

export function lastPlayerOfPeriodLabel(votation, t) {
  return t(
    isSemester(votation) ? 'label_last_player_of_the_semester' : 'label_last_player_of_the_month'
  );
}

export function formStateToPeriodLabel(data, monthOptions, t) {
  if (data.period_type === 'semester') {
    return data.start_date && data.end_date
      ? fDateRangeShortLabel(data.start_date, data.end_date, true)
      : '';
  }
  return monthOptions.find((o) => o.value === data.month)?.label || data.month || '';
}
