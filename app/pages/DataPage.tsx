import { usePageMeta } from '@/hooks/usePageMeta';
import type { ExportManifest } from '@/types/api';

/**
 * The citable dataset (WS-A).
 *
 * This page exists to be quoted. Everything on it is therefore built around
 * one question a researcher asks before citing anything: what does this cover,
 * and what does it not? Coverage per chain is stated in the table, bounded by
 * monitoring_since, and the caveat is above the numbers rather than beneath
 * them. An overclaim here is not a marketing problem, it is a retraction.
 */

interface Props {
  manifest: ExportManifest | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'not established';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? 'not established'
    : d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCount(n: number): string {
  return n.toLocaleString('en-GB');
}

export default function DataPage({ manifest }: Props) {
  usePageMeta({
    title: 'Data · Slashr',
    description:
      'Every validator penalty event Slashr has observed, as monthly CSV partitions. Coverage stated per chain, CC BY 4.0.',
  });

  if (!manifest) {
    return (
      <main className="page">
        <h1>Data</h1>
        <p>The dataset manifest is temporarily unavailable. Please try again shortly.</p>
      </main>
    );
  }

  const total = manifest.networks.reduce((sum, n) => sum + n.event_count, 0);
  // Every month any chain has data for, newest first. The release series is
  // cross-chain, so it is the union rather than any one chain's list.
  const allMonths = [
    ...new Set(manifest.networks.flatMap((n) => n.months.map((m) => m.month))),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <main className="page">
      <h1>Data</h1>
      <p className="lede">
        Every validator penalty event we have observed, as monthly CSV partitions.{' '}
        {fmtCount(total)} events across {manifest.networks.length} chains.
      </p>

      <section>
        <h2>What this covers</h2>
        <p>{manifest.coverage_note}</p>
        <p>
          Coverage begins when we started watching a chain, which is not when the chain
          started. Each chain states its own anchor below. A count here is what Slashr
          observed in that window, and nothing more should be read into it.
        </p>
      </section>

      <section>
        <h2>Coverage by chain</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Chain</th>
                <th>Monitoring since</th>
                <th>First event</th>
                <th>Last event</th>
                <th>Events</th>
                <th>Months</th>
              </tr>
            </thead>
            <tbody>
              {manifest.networks.map((n) => (
                <tr key={n.slug}>
                  <td>{n.name}</td>
                  <td>{fmtDate(n.monitoring_since)}</td>
                  <td>{fmtDate(n.first_event_at)}</td>
                  <td>{fmtDate(n.last_event_at)}</td>
                  <td>{fmtCount(n.event_count)}</td>
                  <td>{n.months.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Releases</h2>
        <p>
          Each month has a dated release: the headline figures for that window at a
          permanent URL. A closed month is marked final and never changes.
        </p>
        <ul className="release-list">
          {allMonths.map((m) => (
            <li key={m}>
              <a href={`/data/${m}`}>{m}</a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Monthly partitions</h2>
        <p>
          A closed month never changes, so its URL is permanent and safe to cite. The
          current month is still accruing.
        </p>
        {manifest.networks
          .filter((n) => n.months.length > 0)
          .map((n) => (
            <div key={n.slug} className="partition-group">
              <h3>{n.name}</h3>
              <ul className="partition-list">
                {n.months.map((m) => (
                  <li key={m.month}>
                    <a href={m.csv_url}>{m.month}.csv</a>{' '}
                    <span className="muted">{fmtCount(m.event_count)} events</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      <section>
        <h2>Schema</h2>
        <p>
          Columns are append-only: existing columns are never reordered or renamed, so a
          parser written today keeps working.
        </p>
        <ul className="schema-list">
          {manifest.schema.map((col) => (
            <li key={col}>
              <code>{col}</code>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Licence and citation</h2>
        <p>
          Licensed <strong>{manifest.license}</strong>. Quote it, republish it, build on
          it. Attribution is the only condition.
        </p>
        <p>Cite as:</p>
        <pre className="cite-block">
          <code>{manifest.cite_as}</code>
        </pre>
        <p>
          How we classify an event, and what each severity means, is set out in the{' '}
          <a href="/methodology">methodology</a>.
        </p>
      </section>
    </main>
  );
}
