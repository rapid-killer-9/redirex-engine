import type { DailyClick, DeviceClick, CountryClick } from '../../types';
import { fmt } from '../../utils/format';
import { Empty } from '../ui/index';

// ─── Daily click bar chart ────────────────────────────────────────────────────

interface DailyChartProps {
  data: DailyClick[];
}

export function DailyChart({ data }: DailyChartProps) {
  if (data.length === 0) {
    return <Empty message="no click data in this period" />;
  }

  const max = Math.max(...data.map(d => d.clicks), 1);

  return (
    <div>
      <div
        style={{
          display:    'flex',
          alignItems: 'flex-end',
          gap:        '3px',
          height:     '80px',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            title={`${fmt.shortDate(d.day)}: ${d.clicks} clicks`}
            style={{
              flex:         '1 1 0',
              minWidth:     '2px',
              height:       `${Math.max(3, (d.clicks / max) * 100)}%`,
              background:   'var(--ink)',
              borderRadius: '2px 2px 0 0',
              opacity:      0.75,
              cursor:       'default',
              transition:   'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
          />
        ))}
      </div>
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          fontSize:       '10px',
          color:          'var(--ink3)',
          marginTop:      '5px',
        }}
      >
        <span>{fmt.shortDate(data[0].day)}</span>
        <span>{fmt.shortDate(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}

// ─── Horizontal bar chart (devices / countries) ───────────────────────────────

interface HBarItem {
  label:  string;
  clicks: number;
}

interface HBarChartProps {
  data: HBarItem[];
}

export function HBarChart({ data }: HBarChartProps) {
  if (data.length === 0) {
    return <Empty message="no data yet" />;
  }

  const max = data[0].clicks || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width:        '80px',
              fontSize:     '11px',
              color:        'var(--ink3)',
              textAlign:    'right',
              flexShrink:   0,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              flex:         1,
              height:       '5px',
              background:   'var(--border)',
              borderRadius: '3px',
              overflow:     'hidden',
            }}
          >
            <div
              style={{
                width:        `${(item.clicks / max) * 100}%`,
                height:       '100%',
                background:   'var(--ink)',
                borderRadius: '3px',
                transition:   'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ width: '28px', fontSize: '11px', color: 'var(--ink3)', flexShrink: 0 }}>
            {fmt.number(item.clicks)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Typed wrappers ───────────────────────────────────────────────────────────

export function DeviceChart({ data }: { data: DeviceClick[] }) {
  return <HBarChart data={data.map(d => ({ label: d.device, clicks: d.clicks }))} />;
}

export function CountryChart({ data }: { data: CountryClick[] }) {
  return <HBarChart data={data.map(d => ({ label: d.country, clicks: d.clicks }))} />;
}