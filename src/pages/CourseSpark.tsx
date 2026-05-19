import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { canAccessSparkOfferingRoute } from '@/lib/courseRoleAccess';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MouseHandlerDataParam } from 'recharts';
import { useCourseShell } from '@/hooks/useCourseShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchSparkAggregatedStats,
  fetchSparkKeyStats,
  fetchSparkKeysForOffering,
  revokeSparkKey,
  revokeSparkKeysBatch,
} from '@/store/thunks/sparkThunks';
import { fetchTeamsByOffering } from '@/store/thunks/teamsThunks';
import { services } from '@/services';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  Trash2,
  BarChart2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  IssueSparkKeyResult,
  IssueSparkKeysData,
  SparkBucketTopKey,
  SparkKey,
  SparkTopUser,
  SparkUsageSeries,
  Team,
} from '@/services/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseKeyDescription(description: string): {
  teamName: string;
  scope: 'PRODUCTION' | 'DEVELOPMENT' | null;
} {
  const match = description.match(/^(.*) \((PRODUCTION|DEVELOPMENT)\)$/);
  if (match) {
    return {
      teamName: match[1],
      scope: match[2] as 'PRODUCTION' | 'DEVELOPMENT',
    };
  }
  return { teamName: description, scope: null };
}

/** Format a Date as YYYY-MM-DD in local time (avoids UTC shift from toISOString). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatTimeOnly(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatMonthDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDate(date: string) {
  try {
    return parseLocalDate(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

// ─── Usage Calendar ─────────────────────────────────────────────────────────

interface UsageCalendarProps {
  dailyMap: Map<string, { count: number; totalTokens: number }>;
  maxTokens: number;
  weekOffset: number;
  maxWeekOffset: number;
  today: Date;
  onSelectWeek: (offset: number) => void;
  onClose: () => void;
}

function UsageCalendar({
  dailyMap,
  maxTokens,
  weekOffset,
  maxWeekOffset,
  today,
  onSelectWeek,
  onClose,
}: UsageCalendarProps) {
  const initialMonth = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - weekOffset * WEEK_SIZE);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const [viewDate, setViewDate] = useState(initialMonth);
  const [hoverWeekOffset, setHoverWeekOffset] = useState<number | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Render a full grid of weeks (Sun–Sat), including adjacent-month days as muted cells.
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  startDate.setHours(0, 0, 0, 0);

  const lastDayOfMonth = new Date(year, month, daysInMonth);
  lastDayOfMonth.setHours(0, 0, 0, 0);
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
  endDate.setHours(0, 0, 0, 0);

  const cells: Date[] = [];
  for (let d = new Date(startDate); d.getTime() <= endDate.getTime(); ) {
    cells.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const isFuture = (d: Date) => d.getTime() > today.getTime();

  const startOfWeekSunday = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x;
  };

  const anchorWeekStart = startOfWeekSunday(today);

  const weekOffsetForDate = (d: Date) => {
    const ws = startOfWeekSunday(d);
    const diffWeeks = Math.round(
      (anchorWeekStart.getTime() - ws.getTime()) / (86_400_000 * WEEK_SIZE),
    );
    return diffWeeks;
  };

  const weekStartForOffset = (offset: number) => {
    const ws = new Date(anchorWeekStart);
    ws.setDate(anchorWeekStart.getDate() - offset * WEEK_SIZE);
    ws.setHours(0, 0, 0, 0);
    return ws;
  };

  const isInWeekOffset = (d: Date, offset: number) =>
    startOfWeekSunday(d).getTime() === weekStartForOffset(offset).getTime();

  const isInSelectedWeek = (d: Date) => isInWeekOffset(d, weekOffset);

  const getCellStyle = (d: Date | null): React.CSSProperties => {
    if (!d) return {};
    const dateStr = toLocalDateStr(d);
    const entry = dailyMap.get(dateStr);
    if (!entry || entry.totalTokens === 0 || maxTokens === 0) return {};
    const ratio = entry.totalTokens / maxTokens;
    // Interpolate from #dbeafe (blue-100) to #1d4ed8 (blue-700)
    const opacity = 0.15 + ratio * 0.85;
    return { backgroundColor: `rgba(37, 99, 235, ${opacity})` };
  };

  const hasUsage = (d: Date) => {
    const entry = dailyMap.get(toLocalDateStr(d));
    return Boolean(entry && entry.totalTokens > 0 && maxTokens > 0);
  };

  const handleDayClick = (d: Date) => {
    if (isFuture(d)) return;
    const offset = weekOffsetForDate(d);
    if (offset < 0 || offset > maxWeekOffset) return;
    onSelectWeek(offset);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
    >
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded p-1 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700">
          {viewDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded p-1 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label) => (
          <div key={label} className="text-xs font-medium text-gray-400">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((date, i) => {
          const col = i % 7;
          const cellStyle = getCellStyle(date);
          const hasUsageColor = Boolean(cellStyle.backgroundColor);
          const computedOffset = weekOffsetForDate(date);
          const isSelectableWeek =
            computedOffset >= 0 &&
            computedOffset <= maxWeekOffset &&
            !isFuture(date);
          const isOutsideMonth = date.getMonth() !== month;
          const selected = isInSelectedWeek(date) && !isFuture(date);
          const preview =
            !selected &&
            hoverWeekOffset !== null &&
            isInWeekOffset(date, hoverWeekOffset) &&
            !isFuture(date);

          const prev = col > 0 ? cells[i - 1] : null;
          const next = col < 6 ? cells[i + 1] : null;
          const up = i >= 7 ? cells[i - 7] : null;
          const down = i + 7 < cells.length ? cells[i + 7] : null;

          const leftUsage =
            hasUsageColor && prev instanceof Date && hasUsage(prev);
          const rightUsage =
            hasUsageColor && next instanceof Date && hasUsage(next);
          const upUsage = hasUsageColor && up instanceof Date && hasUsage(up);
          const downUsage =
            hasUsageColor && down instanceof Date && hasUsage(down);

          const leftSelected =
            selected &&
            prev instanceof Date &&
            isInSelectedWeek(prev) &&
            !isFuture(prev);
          const rightSelected =
            selected &&
            next instanceof Date &&
            isInSelectedWeek(next) &&
            !isFuture(next);

          const leftPreview =
            preview &&
            prev instanceof Date &&
            hoverWeekOffset !== null &&
            isInWeekOffset(prev, hoverWeekOffset) &&
            !isFuture(prev);
          const rightPreview =
            preview &&
            next instanceof Date &&
            hoverWeekOffset !== null &&
            isInWeekOffset(next, hoverWeekOffset) &&
            !isFuture(next);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(date)}
              disabled={isFuture(date) || !isSelectableWeek}
              onMouseEnter={() => {
                if (!isSelectableWeek) return;
                setHoverWeekOffset(computedOffset);
              }}
              onMouseLeave={() => setHoverWeekOffset(null)}
              onFocus={() => {
                if (!isSelectableWeek) return;
                setHoverWeekOffset(computedOffset);
              }}
              onBlur={() => setHoverWeekOffset(null)}
              title={(() => {
                const entry = dailyMap.get(toLocalDateStr(date));
                return entry
                  ? `${entry.totalTokens.toLocaleString()} tokens, ${entry.count.toLocaleString()} requests`
                  : undefined;
              })()}
              style={cellStyle}
              className={cn(
                'flex h-7 w-full items-center justify-center rounded-none text-xs transition-all',
                isFuture(date) || !isSelectableWeek
                  ? 'cursor-not-allowed text-gray-300'
                  : 'cursor-pointer',
                isOutsideMonth ? 'opacity-50' : '',
                hasUsageColor
                  ? cn(
                      'rounded',
                      leftUsage ? 'rounded-l-none' : '',
                      rightUsage ? 'rounded-r-none' : '',
                      upUsage ? 'rounded-t-none' : '',
                      downUsage ? 'rounded-b-none' : '',
                    )
                  : '',
                selected
                  ? cn(
                      'z-10 rounded font-semibold',
                      // Outline without seams: top/bottom on all, left only on first, right only on last
                      'shadow-[inset_0_2px_0_0_rgba(59,130,246,0.9),inset_0_-2px_0_0_rgba(59,130,246,0.9)]',
                      leftSelected
                        ? 'rounded-l-none'
                        : 'shadow-[inset_2px_0_0_0_rgba(59,130,246,0.9),inset_0_2px_0_0_rgba(59,130,246,0.9),inset_0_-2px_0_0_rgba(59,130,246,0.9)]',
                      rightSelected
                        ? 'rounded-r-none'
                        : 'shadow-[inset_-2px_0_0_0_rgba(59,130,246,0.9),inset_0_2px_0_0_rgba(59,130,246,0.9),inset_0_-2px_0_0_rgba(59,130,246,0.9)]',
                    )
                  : '',
                preview
                  ? cn(
                      'z-10 rounded',
                      // Lighter outline for hover preview, same no-seam approach
                      'shadow-[inset_0_2px_0_0_rgba(59,130,246,0.55),inset_0_-2px_0_0_rgba(59,130,246,0.55)]',
                      leftPreview
                        ? 'rounded-l-none'
                        : 'shadow-[inset_2px_0_0_0_rgba(59,130,246,0.55),inset_0_2px_0_0_rgba(59,130,246,0.55),inset_0_-2px_0_0_rgba(59,130,246,0.55)]',
                      rightPreview
                        ? 'rounded-r-none'
                        : 'shadow-[inset_-2px_0_0_0_rgba(59,130,246,0.55),inset_0_2px_0_0_rgba(59,130,246,0.55),inset_0_-2px_0_0_rgba(59,130,246,0.55)]',
                    )
                  : '',
                isSelectableWeek && !selected && !preview
                  ? 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1'
                  : '',
                !hasUsageColor && !isFuture(date)
                  ? 'bg-gray-50 text-gray-600'
                  : 'text-gray-800',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-xs text-gray-400">Less</span>
        {[0.05, 0.25, 0.5, 0.75, 1].map((r) => (
          <div
            key={r}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: `rgba(37, 99, 235, ${0.15 + r * 0.85})` }}
          />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}

// ─── Stats Panel ────────────────────────────────────────────────────────────

interface StatsPanel {
  offeringId: number;
  sparkKeyId: number;
}

const WEEK_SIZE = 7;

function readBucketTopKeys(bucket: unknown): SparkBucketTopKey[] {
  if (!bucket || typeof bucket !== 'object') return [];
  const tk = (bucket as { topKeys?: SparkBucketTopKey[] }).topKeys;
  return Array.isArray(tk) ? tk : [];
}

/** Sum per-key usage across all buckets, merge by keyId, sort most usage first. */
function aggregateTopKeysAllTime(blocks: unknown[]): SparkBucketTopKey[] {
  const map = new Map<number, SparkBucketTopKey>();
  for (const block of blocks) {
    for (const row of readBucketTopKeys(block)) {
      const prev = map.get(row.keyId);
      if (!prev) {
        map.set(row.keyId, { ...row });
      } else {
        map.set(row.keyId, {
          ...prev,
          count: prev.count + row.count,
          totalTokens: prev.totalTokens + row.totalTokens,
        });
      }
    }
  }
  return Array.from(map.values())
    .filter((r) => r.count > 0 || r.totalTokens > 0)
    .sort(
      (a, b) =>
        b.totalTokens - a.totalTokens || b.count - a.count || a.keyId - b.keyId,
    );
}

/** Recharts may report tooltip index as number or string depending on axis. */
function tooltipIndexToNumber(state: MouseHandlerDataParam): number | undefined {
  const raw = state.activeTooltipIndex ?? state.activeIndex;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

type SparkUsageChartsVariant = 'single-key' | 'aggregated';

function SparkUsageChartsContent({
  stats,
  variant = 'single-key',
}: {
  stats: SparkUsageSeries;
  variant?: SparkUsageChartsVariant;
}) {
  const [chartView, setChartView] = useState<'daily' | 'hourly'>('hourly');
  // 0 = most recent week, 1 = one week back, etc.
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [userBucket, setUserBucket] = useState<{
    kind: 'hourly' | 'daily';
    title: string;
    topKeys: SparkBucketTopKey[];
  } | null>(null);
  const [showAllTimeTopTeams, setShowAllTimeTopTeams] = useState(false);

  // Derive hourly data early so the useMemo calls below are never conditional.
  const hourlyData = useMemo(
    () =>
      (stats.hourly ?? [])
        .map((h) => ({
          ...h,
          ts: new Date(h.hour).getTime(),
          timeLabel: formatTimeOnly(h.hour),
          dateLabel: formatMonthDay(h.hour),
          topKeys: readBucketTopKeys(h),
        }))
        .filter((h) => Number.isFinite(h.ts)),
    [stats],
  );

  // Add a vertical marker at each local midnight boundary in the displayed range.
  const midnightMarkers = useMemo(() => {
    if (hourlyData.length === 0) return [];
    const sorted = [...hourlyData].sort((a, b) => a.ts - b.ts);
    const start = new Date(sorted[0].ts);
    const end = new Date(sorted[sorted.length - 1].ts);

    const markers: Array<{ ts: number; label: string }> = [];
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    // start at next midnight strictly after range start
    if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
    while (d.getTime() <= end.getTime()) {
      markers.push({
        ts: d.getTime(),
        label: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      });
      d.setDate(d.getDate() + 1);
    }
    return markers;
  }, [hourlyData]);

  const noonTicks = useMemo(() => {
    if (hourlyData.length === 0) return [];
    const sorted = [...hourlyData].sort((a, b) => a.ts - b.ts);
    const start = new Date(sorted[0].ts);
    const end = new Date(sorted[sorted.length - 1].ts);

    const ticks: number[] = [];
    const d = new Date(start);
    d.setHours(12, 0, 0, 0);
    // start at first noon at/after range start
    if (d.getTime() < start.getTime()) d.setDate(d.getDate() + 1);
    while (d.getTime() <= end.getTime()) {
      ticks.push(d.getTime());
      d.setDate(d.getDate() + 1);
    }
    return ticks;
  }, [hourlyData]);

  // Build a lookup so we can fill in zero-usage days
  const dailyMap = useMemo(
    () => new Map(stats.daily.map((d) => [d.date.slice(0, 10), d])),
    [stats.daily],
  );
  const maxTokens = useMemo(
    () => Math.max(0, ...stats.daily.map((d) => d.totalTokens)),
    [stats.daily],
  );

  // Anchor the week windows to today so zero-usage days always appear
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeekSunday = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x;
  };

  const anchorWeekStart = startOfWeekSunday(today);

  // How many calendar weeks back does the data reach? (Sun–Sat weeks)
  const earliestDate =
    stats.daily.length > 0
      ? new Date(
          [...stats.daily].sort((a, b) => a.date.localeCompare(b.date))[0].date,
        )
      : today;
  earliestDate.setHours(0, 0, 0, 0);
  const earliestWeekStart = startOfWeekSunday(earliestDate);
  const maxWeekOffset = Math.max(
    0,
    Math.round(
      (anchorWeekStart.getTime() - earliestWeekStart.getTime()) /
        (86_400_000 * WEEK_SIZE),
    ),
  );
  const clampedOffset = Math.min(weekOffset, maxWeekOffset);

  // Generate exactly 7 calendar days for this window, zeroing missing ones
  const weeklyDailyData = useMemo(() => {
    const todayInner = new Date();
    todayInner.setHours(0, 0, 0, 0);
    const startOfWeekSunday = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      x.setDate(x.getDate() - x.getDay());
      return x;
    };
    const anchorWeekStartInner = startOfWeekSunday(todayInner);
    const weekStartDate = new Date(anchorWeekStartInner);
    weekStartDate.setDate(
      anchorWeekStartInner.getDate() - clampedOffset * WEEK_SIZE,
    );
    return Array.from({ length: WEEK_SIZE }, (_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      const dateStr = toLocalDateStr(d);
      const existing = dailyMap.get(dateStr);
      return {
        date: dateStr,
        count: existing?.count ?? 0,
        totalTokens: existing?.totalTokens ?? 0,
        label: formatDate(dateStr),
        topKeys: readBucketTopKeys(existing),
      };
    });
  }, [clampedOffset, dailyMap]);

  const weekLabel = `${weeklyDailyData[0].label} – ${weeklyDailyData[6].label}`;

  const todayLabel = weeklyDailyData.find(
    (d) => d.date === toLocalDateStr(today),
  )?.label;

  const hasDaily = stats.daily.length > 0;
  const hasHourly = hourlyData.length > 0;
  const hasAnyData = hasDaily || hasHourly;

  const effectiveView =
    chartView === 'daily' && !hasDaily ? 'hourly' : chartView;

  const defaultAggregatedBucket = useMemo(() => {
    if (variant !== 'aggregated') return null;
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateStr(todayD);

    if (effectiveView === 'daily' && weeklyDailyData.length > 0) {
      const row =
        weeklyDailyData.find((d) => d.date === todayStr) ??
        weeklyDailyData.reduce((best, d) => {
          const db = Math.abs(
            parseLocalDate(d.date).getTime() - todayD.getTime(),
          );
          const bb = Math.abs(
            parseLocalDate(best.date).getTime() - todayD.getTime(),
          );
          return db < bb ? d : best;
        }, weeklyDailyData[0]);
      return {
        kind: 'daily' as const,
        title: row.label,
        topKeys: row.topKeys ?? [],
      };
    }
    if (effectiveView === 'hourly' && hourlyData.length > 0) {
      const now = new Date();
      const sameHour = hourlyData.find((h) => {
        const hd = new Date(h.ts);
        return (
          hd.getFullYear() === now.getFullYear() &&
          hd.getMonth() === now.getMonth() &&
          hd.getDate() === now.getDate() &&
          hd.getHours() === now.getHours()
        );
      });
      const row =
        sameHour ??
        hourlyData.reduce((a, b) =>
          Math.abs(a.ts - now.getTime()) < Math.abs(b.ts - now.getTime())
            ? a
            : b,
        );
      return {
        kind: 'hourly' as const,
        title: `${row.dateLabel} · ${row.timeLabel}`,
        topKeys: row.topKeys ?? [],
      };
    }
    return null;
  }, [variant, effectiveView, weeklyDailyData, hourlyData]);

  const resolvedBucket = userBucket ?? defaultAggregatedBucket;

  const visibleBucketTopKeys = useMemo(() => {
    if (!resolvedBucket) return [];
    return resolvedBucket.topKeys.filter(
      (row) => row.totalTokens > 0 || row.count > 0,
    );
  }, [resolvedBucket]);

  const allTimeTopTeamsRows = useMemo(() => {
    if (variant !== 'aggregated') return [];
    const daily = stats.daily ?? [];
    const hourly = stats.hourly ?? [];
    const blocks =
      daily.length > 0 ? daily : hourly.length > 0 ? hourly : [];
    return aggregateTopKeysAllTime(blocks);
  }, [variant, stats.daily, stats.hourly]);

  const allTimeTopTeamsSource: 'daily' | 'hourly' | 'none' = useMemo(() => {
    if (variant !== 'aggregated') return 'none';
    const daily = stats.daily ?? [];
    const hourly = stats.hourly ?? [];
    if (daily.length > 0) return 'daily';
    if (hourly.length > 0) return 'hourly';
    return 'none';
  }, [variant, stats.daily, stats.hourly]);

  const visibleTopTeamsRows = showAllTimeTopTeams
    ? allTimeTopTeamsRows
    : visibleBucketTopKeys;

  const selectedBucketDailyLabel = useMemo(() => {
    if (
      variant !== 'aggregated' ||
      !resolvedBucket ||
      resolvedBucket.kind !== 'daily'
    ) {
      return undefined;
    }
    const row = weeklyDailyData.find((d) => d.label === resolvedBucket.title);
    return row?.label;
  }, [variant, resolvedBucket, weeklyDailyData]);

  const selectedBucketHourlyTs = useMemo(() => {
    if (
      variant !== 'aggregated' ||
      !resolvedBucket ||
      resolvedBucket.kind !== 'hourly'
    ) {
      return undefined;
    }
    const row = hourlyData.find(
      (h) => `${h.dateLabel} · ${h.timeLabel}` === resolvedBucket.title,
    );
    return row?.ts;
  }, [variant, resolvedBucket, hourlyData]);

  useEffect(() => {
    setUserBucket(null);
  }, [chartView, weekOffset, clampedOffset, effectiveView]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-xs">
        {[
          {
            label: 'Total Requests',
            value: stats.totalRequests.toLocaleString(),
          },
          { label: 'Total Tokens', value: stats.totalTokens.toLocaleString() },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {hasAnyData ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-700">
                {effectiveView === 'daily'
                  ? 'Daily Token Usage'
                  : 'Hourly Token Usage'}
              </h4>
              {effectiveView === 'daily' && hasDaily && (
                <div className="relative flex items-center gap-1">
                  <button
                    onClick={() => setWeekOffset((o) => o + 1)}
                    disabled={clampedOffset >= maxWeekOffset}
                    className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCalendarOpen((o) => !o)}
                    className="min-w-[130px] rounded px-1.5 py-0.5 text-center text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {weekLabel}
                  </button>
                  <button
                    onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                    disabled={clampedOffset === 0}
                    className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                  {calendarOpen && (
                    <UsageCalendar
                      dailyMap={dailyMap}
                      maxTokens={maxTokens}
                      weekOffset={clampedOffset}
                      maxWeekOffset={maxWeekOffset}
                      today={today}
                      onSelectWeek={(offset) => setWeekOffset(offset)}
                      onClose={() => setCalendarOpen(false)}
                    />
                  )}
                </div>
              )}
            </div>
            <select
              value={effectiveView}
              onChange={(e) =>
                setChartView(e.target.value as 'daily' | 'hourly')
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {hasDaily && <option value="daily">Daily usage</option>}
              {hasHourly && <option value="hourly">Last 48 hours</option>}
            </select>
          </div>

          {variant === 'aggregated' && (
            <p className="mb-3 text-xs text-gray-500">
              Click anywhere on the chart to change which time bucket is shown
              below.
            </p>
          )}

          {effectiveView === 'daily' && hasDaily && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={weeklyDailyData}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                onClick={
                  variant === 'aggregated'
                    ? (state) => {
                        const idx = tooltipIndexToNumber(state);
                        if (idx === undefined) return;
                        const row = weeklyDailyData[idx];
                        if (!row) return;
                        setUserBucket({
                          kind: 'daily',
                          title: row.label,
                          topKeys: row.topKeys ?? [],
                        });
                      }
                    : undefined
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const tpr =
                      d.count > 0 ? (d.totalTokens / d.count).toFixed(1) : '—';
                    return (
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md space-y-0.5">
                        <p className="font-medium text-gray-700">{d.label}</p>
                        <p className="text-gray-600">
                          Tokens:{' '}
                          <span className="font-medium text-gray-900">
                            {d.totalTokens.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Requests:{' '}
                          <span className="font-medium text-gray-900">
                            {d.count.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Tokens / request:{' '}
                          <span className="font-medium text-gray-900">
                            {tpr}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                {todayLabel && (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    label={{
                      value: 'Today',
                      position: 'insideTopRight',
                      fill: '#6b7280',
                      fontSize: 10,
                    }}
                  />
                )}
                {selectedBucketDailyLabel && (
                  <ReferenceLine
                    x={selectedBucketDailyLabel}
                    stroke="#1d4ed8"
                    strokeWidth={2}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="totalTokens"
                  name="Tokens"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {effectiveView === 'hourly' && hasHourly && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={hourlyData}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                onClick={
                  variant === 'aggregated'
                    ? (state) => {
                        const idx = tooltipIndexToNumber(state);
                        if (idx === undefined) return;
                        const row = hourlyData[idx];
                        if (!row) return;
                        setUserBucket({
                          kind: 'hourly',
                          title: `${row.dateLabel} · ${row.timeLabel}`,
                          topKeys: row.topKeys ?? [],
                        });
                      }
                    : undefined
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  ticks={noonTicks}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    formatTimeOnly(new Date(v).toISOString())
                  }
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                {midnightMarkers.map((m) => (
                  <ReferenceLine
                    key={m.ts}
                    x={m.ts}
                    stroke="#e5e7eb"
                    strokeDasharray="3 3"
                    label={{
                      value: m.label,
                      position: 'insideTopLeft',
                      fill: '#9ca3af',
                      fontSize: 10,
                    }}
                  />
                ))}
                {selectedBucketHourlyTs != null &&
                  Number.isFinite(selectedBucketHourlyTs) && (
                    <ReferenceLine
                      x={selectedBucketHourlyTs}
                      stroke="#1d4ed8"
                      strokeWidth={2}
                    />
                  )}
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const tpr =
                      d.count > 0 ? (d.totalTokens / d.count).toFixed(1) : '—';
                    return (
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md space-y-0.5">
                        <p className="font-medium text-gray-700">
                          {d.dateLabel} • {d.timeLabel}
                        </p>
                        <p className="text-gray-600">
                          Tokens:{' '}
                          <span className="font-medium text-gray-900">
                            {d.totalTokens.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Requests:{' '}
                          <span className="font-medium text-gray-900">
                            {d.count.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Tokens / request:{' '}
                          <span className="font-medium text-gray-900">
                            {tpr}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalTokens"
                  name="Tokens"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {variant === 'aggregated' && hasAnyData && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Top teams in this bucket
                </h4>
                <label className="flex cursor-pointer select-none items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={showAllTimeTopTeams}
                    onChange={(e) => setShowAllTimeTopTeams(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs text-gray-600">
                    All time totals (per key)
                  </span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {showAllTimeTopTeams
                  ? allTimeTopTeamsSource === 'daily'
                    ? 'All keys ranked by total tokens, summed across every day in this report.'
                    : allTimeTopTeamsSource === 'hourly'
                      ? 'All keys ranked by total tokens, summed across every hour in this report (daily history was empty).'
                      : '—'
                  : (resolvedBucket?.title ?? '—')}
              </p>
              {visibleTopTeamsRows.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No teams with usage in this bucket.
                </p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="max-h-[22rem] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 shadow-sm">
                        <tr>
                          <th className="px-3 py-2 font-medium">Team</th>
                          <th className="px-3 py-2 font-medium">Scope</th>
                          <th className="px-3 py-2 text-right font-medium">
                            Tokens
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Requests
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTopTeamsRows.map((row) => {
                          const { teamName, scope } = parseKeyDescription(
                            row.description,
                          );
                          return (
                            <tr
                              key={row.keyId}
                              className="border-t border-gray-100"
                            >
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {teamName}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {scope ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-800">
                                {row.totalTokens.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-800">
                                {row.count.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No usage data available yet.</p>
      )}
    </div>
  );
}

function sparkStatsCacheKey(offeringId: number, sparkKeyId: number) {
  return `${offeringId}:${sparkKeyId}`;
}

function SparkKeyStatsPanel({ offeringId, sparkKeyId }: StatsPanel) {
  const dispatch = useAppDispatch();
  const cacheKey = sparkStatsCacheKey(offeringId, sparkKeyId);
  const stats = useAppSelector((s) => s.spark.statsByKey[cacheKey]);
  const isLoading = useAppSelector(
    (s) => s.spark.statsLoadingByKey[cacheKey] ?? false,
  );

  useEffect(() => {
    void dispatch(fetchSparkKeyStats({ offeringId, sparkKeyId }));
  }, [dispatch, offeringId, sparkKeyId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading usage data…
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4" />
        Failed to load usage statistics.
      </div>
    );
  }

  return <SparkUsageChartsContent stats={stats} />;
}

function topUserLabel(u: SparkTopUser): string {
  const n = u.name?.trim();
  if (n) return n;
  const e = u.email?.trim();
  if (e) return e;
  const net = u.netId?.trim();
  if (net) return net;
  return `User ${u.userId}`;
}

function SparkOfferingUsageOverview({ offeringId }: { offeringId: number }) {
  const dispatch = useAppDispatch();
  const agg = useAppSelector(
    (s) => s.spark.aggregatedStatsByOffering[offeringId],
  );
  const isLoading = useAppSelector(
    (s) => s.spark.aggregatedLoadingByOffering[offeringId] ?? false,
  );

  useEffect(() => {
    void dispatch(fetchSparkAggregatedStats(offeringId));
  }, [dispatch, offeringId]);

  if (isLoading) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        Loading offering usage…
      </div>
    );
  }

  if (!agg) {
    return (
      <div className="mb-8 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Could not load usage overview.
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Usage overview</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {agg.keyIds.length} key{agg.keyIds.length !== 1 ? 's' : ''} included
          {agg.lastUsedAt != null && (
            <>
              {' '}
              · Last used{' '}
              <span className="text-gray-700">{formatDateTime(agg.lastUsedAt)}</span>
            </>
          )}
        </p>
      </div>
      <div className="p-4 md:p-6">
        <SparkUsageChartsContent stats={agg} variant="aggregated" />
        {agg.topUsers.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-gray-900">Top users</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">NetID</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 text-right font-medium">Requests</th>
                    <th className="px-3 py-2 text-right font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.topUsers.map((u) => (
                    <tr key={u.userId} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {topUserLabel(u)}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {u.netId ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {u.email ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-800">
                        {u.requestCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-800">
                        {u.totalTokens.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkKeyCopyButton({ secretKey }: { secretKey: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className="h-7 px-2 text-xs text-gray-500 hover:text-blue-600"
      title={copied ? 'Copied' : 'Copy API key'}
    >
      {copied ? (
        <Check className="mr-1 h-3.5 w-3.5" />
      ) : (
        <Copy className="mr-1 h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

// ─── Issue Keys Modal ────────────────────────────────────────────────────────

interface IssueKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  offeringId: number;
  teams: Team[];
}

type IssueTarget = 'all' | 'selected';

function IssueKeysModal({
  isOpen,
  onClose,
  offeringId,
  teams,
}: IssueKeysModalProps) {
  const dispatch = useAppDispatch();
  const [isIssuing, setIsIssuing] = useState(false);

  const [target, setTarget] = useState<IssueTarget>('all');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(
    new Set(),
  );
  const [scope, setScope] = useState<'PRODUCTION' | 'DEVELOPMENT'>(
    'PRODUCTION',
  );
  const [isSecret, setIsSecret] = useState(true);
  const [limitTPM, setLimitTPM] = useState('');
  const [limitTPH, setLimitTPH] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<{
    teamName: string;
    skipped: boolean;
  }> | null>(null);

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (target === 'selected' && selectedTeamIds.size === 0) {
      setError('Please select at least one team.');
      return;
    }

    const data: IssueSparkKeysData = {
      scope,
      isSecret,
    };

    if (target === 'selected') {
      data.teamIds = Array.from(selectedTeamIds);
    }

    const tpm = limitTPM ? parseInt(limitTPM, 10) : undefined;
    const tph = limitTPH ? parseInt(limitTPH, 10) : undefined;

    if (limitTPM) {
      if (isNaN(tpm!) || tpm! <= 0) {
        setError('Tokens per minute must be a positive number.');
        return;
      }
      data.limitTokensPerMinute = tpm;
    }

    if (limitTPH) {
      if (isNaN(tph!) || tph! <= 0) {
        setError('Tokens per hour must be a positive number.');
        return;
      }
      data.limitTokensPerHour = tph;
    }

    try {
      setIsIssuing(true);
      const response = await services.spark.issueKeys(offeringId, data);
      await dispatch(fetchSparkKeysForOffering(offeringId));
      await dispatch(fetchSparkAggregatedStats(offeringId));
      const raw = response.data as unknown;
      const issued: IssueSparkKeyResult[] = Array.isArray(raw)
        ? (raw as IssueSparkKeyResult[])
        : Array.isArray((raw as any)?.data)
          ? ((raw as any).data as IssueSparkKeyResult[])
          : [];
      setResults(
        issued.map((r) => ({
          teamName: r.team.name,
          skipped: r.skipped,
        })),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to issue keys. Please try again.',
      );
    } finally {
      setIsIssuing(false);
    }
  };

  const handleClose = () => {
    if (!isIssuing) {
      setTarget('all');
      setSelectedTeamIds(new Set());
      setScope('PRODUCTION');
      setIsSecret(true);
      setLimitTPM('');
      setLimitTPH('');
      setError('');
      setResults(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Issue Spark Keys"
      size="lg"
    >
      {results ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Keys issued successfully. Summary:
          </p>
          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Team
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r) => (
                  <tr key={r.teamName}>
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {r.teamName}
                    </td>
                    <td className="px-4 py-2">
                      {r.skipped ? (
                        <Badge variant="secondary">Already had key</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Issued
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ModalFooter>
            <Button onClick={handleClose}>Done</Button>
          </ModalFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue to
            </label>
            <div className="flex gap-4">
              {(['all', 'selected'] as IssueTarget[]).map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="target"
                    value={opt}
                    checked={target === opt}
                    onChange={() => setTarget(opt)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    {opt === 'all' ? 'All teams' : 'Selected teams'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Team selector */}
          {target === 'selected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teams
              </label>
              <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
                {teams.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No teams in this offering.
                  </p>
                ) : (
                  teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.has(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-800">{team.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope
            </label>
            <select
              value={scope}
              onChange={(e) =>
                setScope(e.target.value as 'PRODUCTION' | 'DEVELOPMENT')
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
            </select>
          </div>

          {/* Secret */}
          <div className="flex items-center gap-3">
            <input
              id="isSecret"
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="accent-blue-600"
            />
            <label
              htmlFor="isSecret"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Store as secret (value hidden after issuance)
            </label>
          </div>

          {/* Rate limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token limit / minute
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min={1}
                value={limitTPM}
                onChange={(e) => setLimitTPM(e.target.value)}
                placeholder="No limit"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token limit / hour
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min={1}
                value={limitTPH}
                onChange={(e) => setLimitTPH(e.target.value)}
                placeholder="No limit"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isIssuing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isIssuing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isIssuing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Issuing…
                </span>
              ) : (
                'Issue Keys'
              )}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

// ─── Revoke Confirm Modal ────────────────────────────────────────────────────

interface RevokeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyIds: number[];
  keyLabels: string[];
  offeringId: number;
  onSuccess: () => void;
}

function RevokeConfirmModal({
  isOpen,
  onClose,
  keyIds,
  keyLabels,
  offeringId,
  onSuccess,
}: RevokeConfirmModalProps) {
  const dispatch = useAppDispatch();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    try {
      setIsPending(true);
      if (keyIds.length === 1) {
        await dispatch(
          revokeSparkKey({ offeringId, sparkKeyId: keyIds[0] }),
        ).unwrap();
      } else {
        await dispatch(
          revokeSparkKeysBatch({ offeringId, sparkKeyIds: keyIds }),
        ).unwrap();
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to revoke key(s). Please try again.',
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isPending ? onClose : () => {}}
      title={
        keyIds.length === 1
          ? 'Revoke Spark Key'
          : `Revoke ${keyIds.length} Spark Keys`
      }
      size="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          {keyIds.length === 1
            ? 'Are you sure you want to revoke this key? This action cannot be undone.'
            : `Are you sure you want to revoke ${keyIds.length} keys? This action cannot be undone.`}
        </p>
        <ul className="space-y-1">
          {keyLabels.map((label) => (
            <li
              key={label}
              className="flex items-center gap-2 text-sm text-gray-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Revoking…
            </span>
          ) : (
            'Revoke'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function sortSparkKeyList(
  list: SparkKey[],
  sortKey: string | null,
  sortDir: 'asc' | 'desc',
): SparkKey[] {
  if (!sortKey) return list;
  return [...list].sort((a, b) => {
    let aVal: string | number | null = null;
    let bVal: string | number | null = null;
    if (sortKey === 'team') {
      aVal = parseKeyDescription(a.description).teamName;
      bVal = parseKeyDescription(b.description).teamName;
    } else if (sortKey === 'scope') {
      aVal = parseKeyDescription(a.description).scope ?? '';
      bVal = parseKeyDescription(b.description).scope ?? '';
    } else if (sortKey === 'limitTPM') {
      aVal = a.limitTokensPerMinute ?? -1;
      bVal = b.limitTokensPerMinute ?? -1;
    } else if (sortKey === 'limitTPH') {
      aVal = a.limitTokensPerHour ?? -1;
      bVal = b.limitTokensPerHour ?? -1;
    } else if (sortKey === 'status') {
      aVal = a.isActive === false ? 0 : 1;
      bVal = b.isActive === false ? 0 : 1;
    }
    if (aVal === null || bVal === null) return 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const cmp = (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

// ─── Expandable Row ──────────────────────────────────────────────────────────

interface ExpandableKeyRowProps {
  sparkKey: SparkKey;
  offeringId: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onRevoke: () => void;
  /** When false, the row has no bulk-select checkbox (e.g. revoked keys list). */
  showSelection?: boolean;
}

function ExpandableKeyRow({
  sparkKey,
  offeringId,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onRevoke,
  showSelection = true,
}: ExpandableKeyRowProps) {
  const { teamName, scope } = parseKeyDescription(sparkKey.description);

  return (
    <>
      <tr
        className={cn(
          'border-b border-gray-100 hover:bg-gray-50 transition-colors',
          isSelected && 'bg-blue-50 hover:bg-blue-50',
        )}
      >
        {/* Checkbox */}
        <td className="w-10 px-4 py-3">
          {showSelection ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="accent-blue-600 cursor-pointer"
              aria-label={`Select key for ${teamName}`}
            />
          ) : null}
        </td>

        {/* Expand toggle */}
        <td className="w-8 px-2 py-3">
          <button
            onClick={onToggleExpand}
            className="flex items-center justify-center rounded p-0.5 hover:bg-gray-200 transition-colors"
            aria-label={isExpanded ? 'Collapse stats' : 'Expand stats'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </td>

        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {teamName}
        </td>

        <td className="px-4 py-3">
          {scope && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium',
                scope === 'PRODUCTION'
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-amber-300 bg-amber-50 text-amber-700',
              )}
            >
              {scope}
            </Badge>
          )}
        </td>

        <td className="px-4 py-3 text-sm text-gray-500">
          {sparkKey.limitTokensPerMinute != null
            ? sparkKey.limitTokensPerMinute.toLocaleString()
            : '—'}
        </td>

        <td className="px-4 py-3 text-sm text-gray-500">
          {sparkKey.limitTokensPerHour != null
            ? sparkKey.limitTokensPerHour.toLocaleString()
            : '—'}
        </td>

        <td className="px-4 py-3">
          {sparkKey.isActive === false ? (
            <Badge
              variant="secondary"
              className="text-xs bg-red-50 text-red-600 border-red-200"
            >
              Revoked
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-xs bg-green-50 text-green-700 border-green-200"
            >
              Active
            </Badge>
          )}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-7 px-2 text-xs text-gray-500 hover:text-blue-600"
            >
              <BarChart2 className="h-3.5 w-3.5 mr-1" />
              Stats
            </Button>
            {sparkKey.key ? (
              <SparkKeyCopyButton secretKey={sparkKey.key} />
            ) : null}
            {sparkKey.isActive !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRevoke}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Revoke
              </Button>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-5">
            <SparkKeyStatsPanel
              offeringId={offeringId}
              sparkKeyId={sparkKey.id}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CourseSpark() {
  const { offeringId: offeringIdParam } = useParams<{
    offeringId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { offering, effectiveRole } = useCourseShell();

  const offeringId = useMemo(() => {
    const n = offeringIdParam ? parseInt(offeringIdParam, 10) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }, [offeringIdParam]);

  const keys = useAppSelector((s) =>
    !Number.isNaN(offeringId)
      ? (s.spark.keysByOfferingId[offeringId] ?? [])
      : [],
  );
  const isLoading = useAppSelector((s) =>
    !Number.isNaN(offeringId)
      ? (s.spark.keysLoadingByOffering[offeringId] ?? false)
      : false,
  );
  const loadError = useAppSelector((s) =>
    !Number.isNaN(offeringId)
      ? s.spark.keysErrorByOffering[offeringId]
      : null,
  );

  const teams = useAppSelector((s) =>
    !Number.isNaN(offeringId)
      ? (s.teams.byOffering[offeringId] ?? [])
      : [],
  );

  useEffect(() => {
    if (Number.isNaN(offeringId)) return;
    void dispatch(fetchSparkKeysForOffering(offeringId));
    void dispatch(fetchTeamsByOffering(offeringId));
    void dispatch(fetchSparkAggregatedStats(offeringId));
  }, [dispatch, offeringId]);

  const error = loadError ? new Error(loadError) : null;

  const [expandedKeyId, setExpandedKeyId] = useState<number | null>(null);
  const [selectedKeyIds, setSelectedKeyIds] = useState<Set<number>>(new Set());
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    keyIds: number[];
    keyLabels: string[];
  } | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [revokedSectionOpen, setRevokedSectionOpen] = useState(false);

  const canManage = effectiveRole === 'ADMIN' || effectiveRole === 'INSTRUCTOR';

  useEffect(() => {
    if (!offeringIdParam || !effectiveRole) return;
    if (!canAccessSparkOfferingRoute(effectiveRole)) {
      navigate(`/courses/${offeringIdParam}`, { replace: true });
    }
  }, [offeringIdParam, effectiveRole, navigate]);

  const activeKeys = useMemo(
    () => (keys ?? []).filter((k) => k.isActive !== false),
    [keys],
  );

  const deactivatedKeys = useMemo(
    () => (keys ?? []).filter((k) => k.isActive === false),
    [keys],
  );

  const sortedActiveKeys = useMemo(
    () => sortSparkKeyList(activeKeys, sortKey, sortDir),
    [activeKeys, sortKey, sortDir],
  );

  const sortedDeactivatedKeys = useMemo(
    () => sortSparkKeyList(deactivatedKeys, sortKey, sortDir),
    [deactivatedKeys, sortKey, sortDir],
  );

  const activeKeysAggregate = useMemo(() => {
    let totalTpm = 0;
    let totalTph = 0;
    let hasAnyTpm = false;
    let hasAnyTph = false;
    for (const k of activeKeys) {
      if (k.limitTokensPerMinute != null) {
        totalTpm += k.limitTokensPerMinute;
        hasAnyTpm = true;
      }
      if (k.limitTokensPerHour != null) {
        totalTph += k.limitTokensPerHour;
        hasAnyTph = true;
      }
    }
    return {
      count: activeKeys.length,
      totalTpm,
      totalTph,
      hasAnyTpm,
      hasAnyTph,
    };
  }, [activeKeys]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col)
      return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-gray-700" />
    ) : (
      <ChevronDown className="h-3 w-3 text-gray-700" />
    );
  };

  const toggleExpand = (keyId: number) => {
    setExpandedKeyId((prev) => (prev === keyId ? null : keyId));
  };

  const toggleSelect = (keyId: number) => {
    setSelectedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableIds = (keys ?? [])
      .filter((k) => k.isActive !== false)
      .map((k) => k.id);
    if (selectableIds.every((id) => selectedKeyIds.has(id))) {
      setSelectedKeyIds(new Set());
    } else {
      setSelectedKeyIds(new Set(selectableIds));
    }
  };

  const handleRevokeSelected = () => {
    const targets = (keys ?? []).filter((k) => selectedKeyIds.has(k.id));
    if (targets.length === 0) return;
    setRevokeTarget({
      keyIds: targets.map((k) => k.id),
      keyLabels: targets.map(
        (k) => parseKeyDescription(k.description).teamName,
      ),
    });
  };

  const handleRevokeSingle = (key: SparkKey) => {
    setRevokeTarget({
      keyIds: [key.id],
      keyLabels: [parseKeyDescription(key.description).teamName],
    });
  };

  const handleRevokeSuccess = () => {
    setSelectedKeyIds(new Set());
    setRevokeTarget(null);
  };

  const allActiveSelected =
    activeKeys.length > 0 && activeKeys.every((k) => selectedKeyIds.has(k.id));
  const someSelected = selectedKeyIds.size > 0;

  const offeringLabel = offering?.course
    ? `${offering.course.department} ${offering.course.number}`
    : `Offering ${offeringId}`;

  if (!canManage) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-gray-500 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mt-1 text-sm text-gray-500">
              Manage Spark AI keys for{' '}
              <span className="font-medium text-gray-700">{offeringLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {someSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeSelected}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Revoke Selected ({selectedKeyIds.size})
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Issue Keys
            </Button>
          </div>
        </div>

        <SparkOfferingUsageOverview offeringId={offeringId} />

        {/* Table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading Spark keys…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <p className="text-sm">Failed to load Spark keys.</p>
              <p className="text-xs text-gray-400">
                {(error as any)?.message ?? 'Unknown error'}
              </p>
            </div>
          ) : !keys || keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <BarChart2 className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">
                No Spark keys issued yet
              </p>
              <p className="text-xs">Click "Issue Keys" to get started.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  Active keys (totals)
                </p>
                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm text-gray-800">
                  <span>
                    <span className="font-semibold tabular-nums">
                      {activeKeysAggregate.count}
                    </span>{' '}
                    <span className="text-gray-600">
                      key{activeKeysAggregate.count !== 1 ? 's' : ''}
                    </span>
                  </span>
                  <span>
                    <span className="text-gray-500">Σ limit / min</span>{' '}
                    <span className="font-medium tabular-nums text-gray-900">
                      {activeKeysAggregate.hasAnyTpm
                        ? activeKeysAggregate.totalTpm.toLocaleString()
                        : '—'}
                    </span>
                  </span>
                  <span>
                    <span className="text-gray-500">Σ limit / hr</span>{' '}
                    <span className="font-medium tabular-nums text-gray-900">
                      {activeKeysAggregate.hasAnyTph
                        ? activeKeysAggregate.totalTph.toLocaleString()
                        : '—'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allActiveSelected}
                          onChange={toggleSelectAll}
                          disabled={activeKeys.length === 0}
                          className="accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Select all active keys"
                        />
                      </th>
                      <th className="w-8 px-2 py-3" />
                      {(
                        [
                          { col: 'team', label: 'Team' },
                          { col: 'scope', label: 'Scope' },
                          { col: 'limitTPM', label: 'Limit / min' },
                          { col: 'limitTPH', label: 'Limit / hr' },
                          { col: 'status', label: 'Status' },
                        ] as const
                      ).map(({ col, label }) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer select-none hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-1.5">
                            {label}
                            <SortIcon col={col} />
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActiveKeys.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          No active keys. Issue new keys or check revoked keys
                          below.
                        </td>
                      </tr>
                    ) : (
                      sortedActiveKeys.map((key) => (
                        <ExpandableKeyRow
                          key={key.id}
                          sparkKey={key}
                          offeringId={offeringId}
                          isExpanded={expandedKeyId === key.id}
                          isSelected={selectedKeyIds.has(key.id)}
                          onToggleExpand={() => toggleExpand(key.id)}
                          onToggleSelect={() => toggleSelect(key.id)}
                          onRevoke={() => handleRevokeSingle(key)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {deactivatedKeys.length > 0 && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setRevokedSectionOpen((o) => !o)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    aria-expanded={revokedSectionOpen}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-gray-500 transition-transform',
                        revokedSectionOpen && 'rotate-180',
                      )}
                    />
                    Revoked keys
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-normal text-gray-700 tabular-nums">
                      {deactivatedKeys.length}
                    </span>
                  </button>
                  {revokedSectionOpen && (
                    <div className="overflow-x-auto border-t border-gray-100 bg-gray-50/60">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-gray-100">
                          <tr>
                            <th className="w-10 px-4 py-3" aria-hidden />
                            <th className="w-8 px-2 py-3" />
                            {(
                              [
                                { col: 'team', label: 'Team' },
                                { col: 'scope', label: 'Scope' },
                                { col: 'limitTPM', label: 'Limit / min' },
                                { col: 'limitTPH', label: 'Limit / hr' },
                                { col: 'status', label: 'Status' },
                              ] as const
                            ).map(({ col, label }) => (
                              <th
                                key={col}
                                onClick={() => handleSort(col)}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer select-none hover:bg-gray-200/80"
                              >
                                <div className="flex items-center gap-1.5">
                                  {label}
                                  <SortIcon col={col} />
                                </div>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedDeactivatedKeys.map((key) => (
                            <ExpandableKeyRow
                              key={key.id}
                              sparkKey={key}
                              offeringId={offeringId}
                              isExpanded={expandedKeyId === key.id}
                              isSelected={false}
                              onToggleExpand={() => toggleExpand(key.id)}
                              onToggleSelect={() => {}}
                              onRevoke={() => handleRevokeSingle(key)}
                              showSelection={false}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary footer */}
        {keys && keys.length > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            {activeKeys.length} active · {keys.length - activeKeys.length}{' '}
            revoked · {keys.length} total
          </p>
        )}
      </div>

      {/* Modals */}
      <IssueKeysModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        offeringId={offeringId}
        teams={teams}
      />

      {revokeTarget && (
        <RevokeConfirmModal
          isOpen={!!revokeTarget}
          onClose={() => setRevokeTarget(null)}
          keyIds={revokeTarget.keyIds}
          keyLabels={revokeTarget.keyLabels}
          offeringId={offeringId}
          onSuccess={handleRevokeSuccess}
        />
      )}
    </div>
  );
}
