import React, { useEffect, useState, useCallback } from 'react';
import { Send, Users, MessageCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { getWhatsAppSummary } from '../../services/whatsappService';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
];

function PeriodCard({ label, data, highlight }) {
  const d = data || { sent: 0, contacted: 0, replies: 0, replied: 0, failed: 0, not_sent: 0, reply_rate: 0 };
  return (
    <section
      className="ui-card ui-card-pad"
      aria-label={label}
      style={highlight ? { borderColor: 'var(--ui-primary)', boxShadow: 'var(--ui-focus)' } : undefined}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--ui-text-2)' }}>{label}</h3>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold" style={{ color: 'var(--ui-text)' }}>{d.sent}</span>
        <span className="text-sm" style={{ color: 'var(--ui-muted)' }}>message{d.sent === 1 ? '' : 's'} sent</span>
      </p>
      <ul className="mt-3 space-y-1.5 text-sm" style={{ color: 'var(--ui-text-2)' }}>
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" style={{ color: 'var(--ui-primary-text)' }} aria-hidden="true" />
          <span><strong style={{ color: 'var(--ui-text)' }}>{d.contacted}</strong> new shop{d.contacted === 1 ? '' : 's'} contacted</span>
        </li>
        <li className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--ui-success)' }} aria-hidden="true" />
          <span><strong style={{ color: 'var(--ui-text)' }}>{d.replies}</strong> repl{d.replies === 1 ? 'y' : 'ies'} from {d.replied} shop{d.replied === 1 ? '' : 's'}</span>
        </li>
        {d.failed > 0 && (
          <li className="flex items-center gap-2" style={{ color: 'var(--ui-danger)' }}>
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong>{d.failed}</strong> failed</span>
          </li>
        )}
        {d.not_sent > 0 && (
          <li className="flex items-center gap-2" style={{ color: 'var(--ui-warning)' }}>
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong>{d.not_sent}</strong> saved but not sent (test mode)</span>
          </li>
        )}
      </ul>
      {d.contacted > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 ui-badge ui-badge-info">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          {d.reply_rate}% of new shops replied
        </p>
      )}
    </section>
  );
}

function DailyChart({ days }) {
  const max = Math.max(1, ...days.flatMap((d) => [d.sent, d.received]));
  const bar = (value, color, label) => (
    <div className="flex flex-col items-center justify-end h-full" style={{ width: 18 }} title={`${label}: ${value}`}>
      <span className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--ui-text-2)' }}>{value || ''}</span>
      <div style={{ width: 14, height: value ? `${Math.max(4, (value / max) * 100)}%` : 2, background: value ? color : 'var(--ui-border)', borderRadius: 4 }} />
    </div>
  );
  return (
    <section className="ui-card ui-card-pad" aria-label="Last 7 days, day by day">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold" style={{ color: 'var(--ui-text)' }}>Day by day (last 7 days)</h3>
        <span className="flex items-center gap-4 text-sm" style={{ color: 'var(--ui-text-2)' }}>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: 'var(--ui-primary)' }} />Sent</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: 'var(--ui-success)' }} />Replies received</span>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1" style={{ height: 150 }} role="list">
        {days.map((d) => (
          <div key={d.date} role="listitem" className="flex flex-col items-center min-w-0" aria-label={`${d.label}: ${d.sent} sent, ${d.received} replies`}>
            <div className="flex items-end justify-center gap-1 flex-1 w-full">
              {bar(d.sent, 'var(--ui-primary)', 'Sent')}
              {bar(d.received, 'var(--ui-success)', 'Replies received')}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {days.map((d) => (
          <span key={d.date} className="text-[11px] sm:text-xs text-center" style={{ color: 'var(--ui-muted)' }}>{d.label.replace(/ (\w{3})$/, ' $1')}</span>
        ))}
      </div>
    </section>
  );
}

/** "Your activity": how many messages went out and came back, today, yesterday and over time. */
export default function WhatsAppActivitySummary() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getWhatsAppSummary());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    const onUpdated = () => load();
    window.addEventListener('whatsapp-updated', onUpdated);
    return () => {
      clearInterval(timer);
      window.removeEventListener('whatsapp-updated', onUpdated);
    };
  }, [load]);

  return (
    <div className="mb-5" aria-label="Your WhatsApp activity">
      <div className="flex items-center gap-2 mb-3">
        <Send className="h-5 w-5" style={{ color: 'var(--ui-primary-text)' }} aria-hidden="true" />
        <h2 className="ui-h2" style={{ margin: 0 }}>Your activity</h2>
        <span className="ui-help">Indian time, your chats only</span>
      </div>

      {failed && !data && (
        <div className="ui-notice ui-notice-warning" role="status">The numbers could not be loaded. Press Refresh to try again.</div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PERIODS.map((p, i) => (
              <PeriodCard key={p.key} label={p.label} data={data.periods?.[p.key]} highlight={i === 0} />
            ))}
          </div>
          <DailyChart days={data.daily || []} />
        </div>
      )}

      {!data && !failed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-busy="true">
          {PERIODS.map((p) => (
            <div key={p.key} className="ui-card ui-card-pad" style={{ minHeight: 150, opacity: 0.6 }}>
              <span className="text-sm" style={{ color: 'var(--ui-muted)' }}>{p.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
