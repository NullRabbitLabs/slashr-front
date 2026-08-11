import { usePageMeta } from '@/hooks/usePageMeta';
import type { Release } from '@/types/api';

/**
 * A dated release (WS-E): the citable unit of the dataset series.
 *
 * Everything here is arranged so that a figure cannot travel without its
 * caveat. The provisional banner sits above the numbers, not below them; the
 * coverage note is in the same block as the totals; the cite-as string names
 * the month. Someone skimming for a number to quote should hit the qualifier
 * before they hit the number.
 */

interface Props {
  release: Release | null;
  month: string;
}

function fmtCount(n: number): string {
  return n.toLocaleString('en-GB');
}

function fmtUsd(n: number | null): string {
  if (n == null || n < 1) return '—';
  return `$${Math.round(n).toLocaleString('en-GB')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return isNaN(d.getTime())
    ? month
    : d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

export default function ReleasePage({ release, month }: Props) {
  usePageMeta({
    title: `${monthLabel(month)} · Slashr validator penalty release`,
    description: `Validator penalties observed by Slashr in ${monthLabel(month)}, per chain, with coverage bounds. CC BY 4.0.`,
  });

  if (!release) {
    return (
      <main className="page">
        <h1>{monthLabel(month)}</h1>
        <p>This release is temporarily unavailable. Please try again shortly.</p>
        <p>
          <a href="/data">Back to the dataset</a>
        </p>
      </main>
    );
  }

  const provisional = release.status !== 'final';

  return (
    <main className="page">
      <h1>{monthLabel(month)}</h1>

      {provisional && (
        <p className="notice notice-warning">
          <strong>Provisional.</strong> This month is still accruing, so these
          figures will change. Quote them as a partial month or wait for the
          release to be marked final.
        </p>
      )}

      <section>
        <h2>Headline</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">{fmtCount(release.totals.events)}</div>
            <div className="stat-label">events observed</div>
          </div>
          <div className="stat">
            <div className="stat-value">{fmtCount(release.totals.slashing_events)}</div>
            <div className="stat-label">on chains that slash stake</div>
          </div>
          <div className="stat">
            <div className="stat-value">{fmtCount(release.totals.validators)}</div>
            <div className="stat-label">validators involved</div>
          </div>
          <div className="stat">
            <div className="stat-value">{fmtUsd(release.totals.loss_usd)}</div>
            <div className="stat-label">measured loss</div>
          </div>
        </div>
        <p className="muted">{release.coverage_note}</p>
      </section>

      <section>
        <h2>By chain</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Chain</th>
                <th>Events</th>
                <th>Slashing</th>
                <th>Validators</th>
                <th>Measured loss</th>
                <th>Monitoring since</th>
              </tr>
            </thead>
            <tbody>
              {release.chains.map((c) => (
                <tr key={c.slug}>
                  <td>{c.name}</td>
                  <td>{fmtCount(c.events)}</td>
                  <td>{c.slashing_events > 0 ? fmtCount(c.slashing_events) : '—'}</td>
                  <td>{fmtCount(c.validators)}</td>
                  <td>{fmtUsd(c.loss_usd)}</td>
                  <td>
                    {c.monitoring_since
                      ? c.monitoring_since.slice(0, 10)
                      : 'not established'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          A chain shows a slashing count only where its protocol reduces principal
          stake. Downtime on a chain with no slashing mechanism is an outage, not
          a penalty, and is counted as an event only.
        </p>
      </section>

      <section>
        <h2>Cite this release</h2>
        <pre className="cite-block">
          <code>{release.cite_as}</code>
        </pre>
        <p>
          Licensed <strong>{release.license}</strong>. The underlying events are
          downloadable as <a href="/data">monthly CSV partitions</a>, and the
          classification rules are in the <a href="/methodology">methodology</a>.
        </p>
      </section>
    </main>
  );
}
