import type { AdminOverview } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { useLanguage } from '../../../i18n/language';
import { useAdminExtraCopy } from '../../adminExtraI18n';

export function AdminAnalyticsView({
  overview,
  days,
  onDays,
}: {
  overview: AdminOverview | null;
  days: number;
  onDays: (days: number) => void;
}) {
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const maxValue = Math.max(1, ...(overview?.trend.map((item) => item.grossBookingValue) || [1]));
  return (
    <section className="admin-content">
      <div className="analytics-toolbar">
        <div>
          <h2>{extra.businessAnalytics}</h2>
          <p>{extra.analyticsText}</p>
        </div>
        <select value={days} onChange={(event) => onDays(Number(event.target.value))}>
          <option value="7">{extra.last7}</option>
          <option value="30">{extra.last30}</option>
          <option value="90">{extra.last90}</option>
        </select>
      </div>
      <div className="analytics-grid">
        <section className="admin-panel analytics-chart">
          <div className="panel-heading">
            <h2>{extra.grossBookingValue}</h2>
            <span>MAD</span>
          </div>
          <div className="bar-chart" role="img" aria-label={extra.grossBookingValue}>
            {overview?.trend.map((item) => (
              <div
                className="bar-column"
                key={item.date}
                title={`${formatDate(item.date)}: ${item.grossBookingValue} MAD`}
              >
                <i
                  style={{ height: `${Math.max(3, (item.grossBookingValue / maxValue) * 100)}%` }}
                />
                <small>{new Date(item.date).getDate()}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>{extra.categoryPerformance}</h2>
          </div>
          <div className="metric-list">
            {overview?.categories.map((item) => (
              <div key={item.slug}>
                <span>
                  <b>{decodeText(item.name)}</b>
                  <small>
                    {item.listings} {extra.listings} · {item.bookings} {extra.bookings}
                  </small>
                </span>
                <strong>{Math.round(item.grossBookingValue).toLocaleString()} MAD</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
