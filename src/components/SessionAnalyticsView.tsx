import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
  BarChart,
} from 'recharts';
import {
  Activity,
  Compass,
  Gauge,
  Clock,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Download,
} from 'lucide-react';
import { EmergencySession, LocationRecord } from '../types';

interface SessionAnalyticsViewProps {
  session: EmergencySession;
  className?: string;
  onClose?: () => void;
}

type MetricMode = 'all' | 'accuracy' | 'frequency' | 'velocity';

interface ChartDataPoint {
  index: number;
  timeLabel: string;
  elapsedSec: number;
  elapsedFormatted: string;
  timestamp: number;
  accuracy: number;
  intervalDeltaSec: number;
  pingsPerMinute: number;
  cumulativePings: number;
  speedKmh: number;
  latitude: number;
  longitude: number;
  qualityTier: 'excellent' | 'good' | 'degraded';
}

export const SessionAnalyticsView: React.FC<SessionAnalyticsViewProps> = ({
  session,
  className = '',
  onClose,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('all');
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  // Process breadcrumb history into structured chart data
  const { chartData, stats } = useMemo(() => {
    let rawHistory: LocationRecord[] = session.breadcrumbHistory || [];

    // Ensure at least start and current location are represented if history is minimal
    if (rawHistory.length === 0) {
      if (session.startLocation) rawHistory = [session.startLocation];
      if (session.currentLocation && session.currentLocation !== session.startLocation) {
        rawHistory = [...rawHistory, session.currentLocation];
      }
    }

    const sessionStartTime = session.startedAt || (rawHistory[0]?.timestamp ?? Date.now());

    // Build data points
    const points: ChartDataPoint[] = [];
    let prevTime = sessionStartTime;
    let sumAcc = 0;
    let minAcc = Infinity;
    let maxAcc = -Infinity;
    let maxSpeed = 0;

    rawHistory.forEach((crumb, idx) => {
      const ts = crumb.timestamp || sessionStartTime + idx * 10000;
      const elapsedSec = Math.max(0, Math.round((ts - sessionStartTime) / 1000));
      const deltaSec = idx === 0 ? 0 : Math.max(1, Math.round((ts - prevTime) / 1000));
      prevTime = ts;

      const acc = Number((crumb.accuracy || 15).toFixed(1));
      sumAcc += acc;
      if (acc < minAcc) minAcc = acc;
      if (acc > maxAcc) maxAcc = acc;

      const spdKmh = crumb.speed ? Number((crumb.speed * 3.6).toFixed(1)) : 0;
      if (spdKmh > maxSpeed) maxSpeed = spdKmh;

      // Calculate rolling frequency (pings within 60s window or based on cadence)
      const windowStart = ts - 60000;
      const windowPings = rawHistory.filter(
        (c) => c.timestamp >= windowStart && c.timestamp <= ts
      ).length;
      const pingsPerMin = Math.max(1, windowPings || (deltaSec > 0 ? Math.round(60 / deltaSec) : 6));

      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      const elapsedFormatted = `+${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

      const dateObj = new Date(ts);
      const timeLabel = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      let qualityTier: 'excellent' | 'good' | 'degraded' = 'good';
      if (acc <= 10) qualityTier = 'excellent';
      else if (acc > 25) qualityTier = 'degraded';

      points.push({
        index: idx + 1,
        timeLabel,
        elapsedSec,
        elapsedFormatted,
        timestamp: ts,
        accuracy: acc,
        intervalDeltaSec: deltaSec,
        pingsPerMinute: pingsPerMin,
        cumulativePings: idx + 1,
        speedKmh: spdKmh,
        latitude: crumb.latitude,
        longitude: crumb.longitude,
        qualityTier,
      });
    });

    // If only 1 point exists, construct a second projection point so line charts draw smoothly
    if (points.length === 1) {
      const p = points[0];
      points.push({
        index: 2,
        timeLabel: 'Current',
        elapsedSec: p.elapsedSec + 10,
        elapsedFormatted: `+${Math.floor((p.elapsedSec + 10) / 60)}m ${(p.elapsedSec + 10) % 60}s`,
        timestamp: p.timestamp + 10000,
        accuracy: p.accuracy,
        intervalDeltaSec: 10,
        pingsPerMinute: p.pingsPerMinute,
        cumulativePings: 2,
        speedKmh: p.speedKmh,
        latitude: p.latitude,
        longitude: p.longitude,
        qualityTier: p.qualityTier,
      });
    }

    const totalCount = points.length;
    const avgAcc = totalCount > 0 ? Number((sumAcc / (rawHistory.length || 1)).toFixed(1)) : 12;
    const currentAcc = session.currentLocation?.accuracy || avgAcc;
    const sessionDurationSec = Math.max(
      1,
      Math.round(((session.endedAt || Date.now()) - sessionStartTime) / 1000)
    );
    const avgCadenceSec =
      rawHistory.length > 1
        ? Number((sessionDurationSec / (rawHistory.length - 1)).toFixed(1))
        : session.updateIntervalSeconds;

    return {
      chartData: points,
      stats: {
        totalPings: rawHistory.length || points.length,
        currentAccuracy: currentAcc,
        avgAccuracy: avgAcc,
        bestAccuracy: minAcc === Infinity ? currentAcc : minAcc,
        worstAccuracy: maxAcc === -Infinity ? currentAcc : maxAcc,
        avgCadenceSec,
        maxSpeedKmh: maxSpeed,
        sessionDurationSec,
      },
    };
  }, [session]);

  const handleExportCSV = () => {
    if (typeof window === 'undefined' || chartData.length === 0) return;
    const headers = [
      'Index',
      'Time',
      'Elapsed (s)',
      'Accuracy (m)',
      'Interval Delta (s)',
      'Pings/Min',
      'Speed (km/h)',
      'Latitude',
      'Longitude',
    ];
    const rows = chartData.map((d) => [
      d.index,
      d.timeLabel,
      d.elapsedSec,
      d.accuracy,
      d.intervalDeltaSec,
      d.pingsPerMinute,
      d.speedKmh,
      d.latitude,
      d.longitude,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SafeHer_Analytics_${session.incidentId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="session-analytics-view"
      className={`flex flex-col bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 p-4 space-y-4 shadow-2xl ${className}`}
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>GPS Telemetry & Ping Analytics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                  {session.incidentId}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Real-time tracking precision trends and breadcrumb transmission cadence
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1 rounded-xl border border-stone-800 shrink-0">
          <button
            type="button"
            onClick={() => setMetricMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              metricMode === 'all'
                ? 'bg-rose-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Dual Trend
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('accuracy')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              metricMode === 'accuracy'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Accuracy
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('frequency')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              metricMode === 'frequency'
                ? 'bg-sky-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Cadence
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1 px-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 transition flex items-center gap-1 ml-1"
            title="Export CSV data"
          >
            <Download className="w-3 h-3 text-stone-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Current Accuracy */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <span>Current Precision</span>
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-emerald-400">
              ±{stats.currentAccuracy}m
            </span>
            <span className="text-[10px] text-stone-400">radius</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
            {stats.currentAccuracy <= 10 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> High Precision
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Info className="w-2.5 h-2.5" /> Urban Triangulation
              </span>
            )}
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <span>Avg Session Error</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-sky-400">
              ±{stats.avgAccuracy}m
            </span>
            <span className="text-[10px] text-stone-400">mean</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Best: <strong className="text-emerald-300">±{stats.bestAccuracy}m</strong> • Max:{' '}
            <strong className="text-stone-300">±{stats.worstAccuracy}m</strong>
          </div>
        </div>

        {/* Total Breadcrumb Pings */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <span>Total GPS Pings</span>
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-rose-400">
              {stats.totalPings}
            </span>
            <span className="text-[10px] text-stone-400">logged</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Configured: <strong>{session.updateIntervalSeconds}s</strong> cadence
          </div>
        </div>

        {/* Transmission Frequency */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <span>Actual Cadence</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-amber-400">
              ~{stats.avgCadenceSec}s
            </span>
            <span className="text-[10px] text-stone-400">/ ping</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Active for {Math.floor(stats.sessionDurationSec / 60)}m {stats.sessionDurationSec % 60}s
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-3 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-200">
              {metricMode === 'all' && 'GPS Accuracy (m) vs. Transmission Cadence (sec)'}
              {metricMode === 'accuracy' && 'GPS Error Radius Trend Over Time (Lower is Better)'}
              {metricMode === 'frequency' && 'Ping Frequency & Intervals Over Session Time'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Accuracy (m)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
              Interval / Frequency
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  setSelectedPoint(data.activePayload[0].payload as ChartDataPoint);
                }
              }}
            >
              <defs>
                <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="frequencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.15} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />

              <XAxis
                dataKey="elapsedFormatted"
                stroke="#78716c"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#44403c' }}
              />

              {/* Left Y-Axis: Accuracy in Meters */}
              <YAxis
                yAxisId="left"
                stroke="#10b981"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#44403c' }}
                domain={[0, (dataMax: number) => Math.max(30, Math.ceil(dataMax * 1.25))]}
                unit="m"
              />

              {/* Right Y-Axis: Cadence seconds or Frequency count */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0284c7"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#44403c' }}
                domain={[0, 'auto']}
                unit={metricMode === 'frequency' ? ' p/m' : 's'}
              />

              {/* Standard Threshold Reference Line for Precision GPS */}
              <ReferenceLine
                yAxisId="left"
                y={10}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Target ≤10m High Precision',
                  position: 'insideTopLeft',
                  fill: '#34d399',
                  fontSize: 9,
                }}
              />

              <Tooltip content={<CustomAnalyticsTooltip />} />

              {/* Accuracy Trend Area */}
              {(metricMode === 'all' || metricMode === 'accuracy') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  name="GPS Accuracy (m)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#accuracyGrad)"
                  dot={{ r: 3, fill: '#10b981', stroke: '#064e3b', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {/* Breadcrumb Frequency / Interval Bars or Line */}
              {(metricMode === 'all' || metricMode === 'frequency') && (
                <Bar
                  yAxisId="right"
                  dataKey={metricMode === 'frequency' ? 'pingsPerMinute' : 'intervalDeltaSec'}
                  name={metricMode === 'frequency' ? 'Pings / Min' : 'Interval Delta (s)'}
                  fill="url(#frequencyGrad)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              )}

              {/* Cumulative Pings Trend Line */}
              {metricMode === 'frequency' && (
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="cumulativePings"
                  name="Total Pings Logged"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Data Point Callout */}
        {selectedPoint && (
          <div className="mt-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-stone-200">
                Ping #{selectedPoint.index} at {selectedPoint.timeLabel} ({selectedPoint.elapsedFormatted})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-stone-300">
              <span>Accuracy: <strong className="text-emerald-400">±{selectedPoint.accuracy}m</strong></span>
              <span>Cadence: <strong className="text-sky-400">+{selectedPoint.intervalDeltaSec}s</strong></span>
              <span>Coords: <strong className="text-stone-400">{selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className="text-[10px] text-stone-400 hover:text-white px-2 py-0.5 rounded bg-stone-800"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Explanatory Footer & ISO Non-Repudiation Note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-stone-400 bg-stone-900/40 border border-stone-800/60 rounded-xl p-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Telemetry samples are signed and appended to the emergency ledger at each transmission pulse.
          </span>
        </div>
        <div className="font-mono text-[10px] text-stone-400 shrink-0">
          Sync Rate: {session.updateIntervalSeconds}s • GPS State: {session.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

/**
 * Custom Recharts Tooltip Component for SafeHer Session Analytics
 */
const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data: ChartDataPoint = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between border-b border-stone-800 pb-1">
        <span className="font-bold text-white flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          Ping #{data.index}
        </span>
        <span className="font-mono text-[10px] text-stone-400">{data.timeLabel}</span>
      </div>

      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">GPS Accuracy:</span>
          <span className="font-mono font-bold text-emerald-400">±{data.accuracy} m</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">Interval Delta:</span>
          <span className="font-mono font-bold text-sky-400">{data.intervalDeltaSec}s</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">Transmission Rate:</span>
          <span className="font-mono font-bold text-amber-400">{data.pingsPerMinute} pings/min</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-stone-400">Elapsed Time:</span>
          <span className="font-mono text-stone-300">{data.elapsedFormatted}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-[10px] border-t border-stone-800/80 pt-1 text-stone-400">
          <span>Precision Quality:</span>
          <span
            className={`font-bold uppercase ${
              data.qualityTier === 'excellent'
                ? 'text-emerald-400'
                : data.qualityTier === 'good'
                ? 'text-sky-400'
                : 'text-amber-400'
            }`}
          >
            {data.qualityTier === 'excellent'
              ? 'Military Precision'
              : data.qualityTier === 'good'
              ? 'Good Urban'
              : 'Degraded / Cell'}
          </span>
        </div>
      </div>
    </div>
  );
};
