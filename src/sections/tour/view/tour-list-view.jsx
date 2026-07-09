import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { orderBy } from 'src/utils/helper';

import { useGetTours } from 'src/actions/tours';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TourList } from '../tour-list';
import { TourSeasonStats } from '../tour-season-stats';

// ----------------------------------------------------------------------

// values below are i18n keys, resolved via t() at render time.
const MONTH_NAMES = [
  'month_jan_abbr',
  'month_feb_abbr',
  'month_mar_abbr',
  'month_apr_abbr',
  'month_may_abbr',
  'month_jun_abbr',
  'month_jul_abbr',
  'month_aug_abbr',
  'month_sep_abbr',
  'month_oct_abbr',
  'month_nov_abbr',
  'month_dec_abbr',
];

function getTs(tour) {
  const s = tour.available?.startDate;
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : new Date(s).getTime();
}

// ----------------------------------------------------------------------

export function TourListView() {
  const { t } = useTranslation();
  const { selectedWorkspace } = useWorkspace();
  const { tours } = useGetTours(selectedWorkspace?.id, 'match');

  // Derive available months from tours, sorted newest first
  const months = useMemo(() => {
    const seen = new Map();
    tours.forEach((tour) => {
      const ts = getTs(tour);
      if (!ts) return;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.set(key, { key, label: `${t(MONTH_NAMES[d.getMonth()])} ${d.getFullYear()}` });
      }
    });
    return [...seen.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [tours, t]);

  // Default to the current (or most recent) month
  const defaultMonth = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return months.find((m) => m.key === currentKey)?.key || months[0]?.key || 'all';
  }, [months]);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const activeMonth = selectedMonth ?? defaultMonth;

  const sorted = useMemo(() => {
    const filtered =
      activeMonth === 'all'
        ? tours
        : tours.filter((tour) => {
            const ts = getTs(tour);
            if (!ts) return false;
            const d = new Date(ts);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return key === activeMonth;
          });

    const now = Date.now();
    const upcoming = orderBy(
      filtered.filter((tour) => getTs(tour) >= now),
      ['available.startDate'],
      ['asc']
    );
    const past = orderBy(
      filtered.filter((tour) => getTs(tour) < now),
      ['available.startDate'],
      ['desc']
    );
    return [...upcoming, ...past];
  }, [tours, activeMonth]);

  const countFor = (key) =>
    key === 'all'
      ? tours.length
      : tours.filter((tour) => {
          const ts = getTs(tour);
          if (!ts) return false;
          const d = new Date(ts);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
        }).length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_matches')}
        links={[{ name: t('label_matches') }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TourSeasonStats tours={tours} />

      {months.length > 0 && (
        <Tabs
          value={activeMonth}
          onChange={(_, v) => setSelectedMonth(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab
            value="all"
            label={
              <span>
                {t('all')}{' '}
                <Label color="default" sx={{ ml: 0.75 }}>
                  {tours.length}
                </Label>
              </span>
            }
          />
          {months.map((m) => (
            <Tab
              key={m.key}
              value={m.key}
              label={
                <span>
                  {m.label}{' '}
                  <Label color="default" sx={{ ml: 0.75 }}>
                    {countFor(m.key)}
                  </Label>
                </span>
              }
            />
          ))}
        </Tabs>
      )}

      {!sorted.length && <EmptyContent filled sx={{ py: 10 }} />}

      <TourList tours={sorted} />
    </DashboardContent>
  );
}
