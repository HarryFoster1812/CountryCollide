import React from 'react';
import { FictionalCountry } from '../lib/types';
import InfoCard from './InfoCard';
import ScenariosView from './ScenariosView';
import CompatibilityMatrix from './CompatibilityMatrix';

interface ResultDisplayProps {
  data: FictionalCountry;
}

/* ---------- formatters ---------- */
const fmtNumber = (n?: number | null) =>
  n == null ? 'N/A' : new Intl.NumberFormat('en-US').format(n);

const fmtCurrency = (n?: number | null) =>
  n == null
    ? 'N/A'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);

const fmtPercent = (n?: number | null, digits = 1) =>
  n == null ? 'N/A' : `${n.toFixed(digits)}%`;

/* Renders "...text [3] more text [7]" with superscript citation links */
const TextWithCitations: React.FC<{
  text: string;
  sources: FictionalCountry['sources'];
}> = ({ text, sources }) => {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\[\d+\]$/.test(part)) {
          const id = Number(part.slice(1, -1));
          const src = sources.find((s) => s.id === id);
          if (!src) return <sup key={i} className="align-super text-xs text-cyan-400">[{id}]</sup>;
          return (
            <sup key={i} className="align-super text-xs">
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
                title={src.title}
              >
                [{id}]
              </a>
            </sup>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
  const langs = data.demographics.languages ?? [];
  const rels = data.demographics.religions ?? [];

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <header className="rounded-2xl border border-gray-800/60 bg-gradient-to-b from-gray-900 to-gray-900/70 p-6 shadow-lg">
        <h2 className="text-4xl md:text-5xl text-center font-bold tracking-tight text-white">
          {data.name}
        </h2>
        {!!data.alt_names?.length && (
          <p className="mt-2 text-center text-sm text-gray-400">
            Also known as: {data.alt_names.join(', ')}
          </p>
        )}
        <p className="mt-4 text-lg leading-relaxed text-gray-200">
          <TextWithCitations text={data.summary} sources={data.sources} />
        </p>
      </header>

      {/* Main layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Demographics + Economy */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InfoCard title="Demographics" className="h-full">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Population</dt>
                  <dd className="font-medium">{fmtNumber(data.demographics.population)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Area</dt>
                  <dd className="font-medium">
                    {fmtNumber(data.demographics.area_km2)} km²
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Urbanization</dt>
                  <dd className="font-medium">
                    {fmtPercent(data.demographics.urbanization_rate)}
                  </dd>
                </div>
              </dl>

              {/* Languages / Religions */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Languages</h4>
                  {langs.length ? (
                    <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-300">
                      {langs.map((l) => (
                        <li key={l.name} className="flex justify-between gap-3">
                          <span className="truncate">{l.name}</span>
                          <span className="tabular-nums">{fmtPercent(l.share)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">N/A</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Religions</h4>
                  {rels.length ? (
                    <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-300">
                      {rels.map((r) => (
                        <li key={r.name} className="flex justify-between gap-3">
                          <span className="truncate">{r.name}</span>
                          <span className="tabular-nums">{fmtPercent(r.share)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">N/A</p>
                  )}
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Economy" className="h-full">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">GDP (Nominal)</dt>
                  <dd className="font-medium">{fmtCurrency(data.economy.gdp_nominal_usd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">GDP per Capita</dt>
                  <dd className="font-medium">{fmtCurrency(data.economy.gdp_per_capita_usd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Real GDP Growth</dt>
                  <dd className="font-medium">
                    {fmtPercent(data.economy.real_gdp_growth_pct)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-200">Sector Shares</h4>
                <ul className="mt-2 space-y-1 text-sm text-gray-300">
                  <li className="flex justify-between gap-3">
                    <span>Services</span>
                    <span className="tabular-nums">
                      {fmtPercent(data.economy.sectors_share.services)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Industry</span>
                    <span className="tabular-nums">
                      {fmtPercent(data.economy.sectors_share.industry)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Agriculture</span>
                    <span className="tabular-nums">
                      {fmtPercent(data.economy.sectors_share.agriculture)}
                    </span>
                  </li>
                </ul>
              </div>
            </InfoCard>
          </div>

          {/* Integration Analysis */}
          <InfoCard title="Integration Analysis" className="h-full">
            <CompatibilityMatrix matrix={data.integration_analysis.compatibility_matrix} />
            {data.integration_analysis.policy_recommendations?.length ? (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-200">Policy Recommendations</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
                  {data.integration_analysis.policy_recommendations.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </InfoCard>

          {/* Scenarios */}
          <ScenariosView scenarios={data.scenarios_10y} />
        </div>

        {/* Right column (sticky on desktop) */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <InfoCard title="Governance" className="h-full">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">System</dt>
                <dd className="font-medium text-right">{data.governance.system}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Legal Tradition</dt>
                <dd className="font-medium text-right">{data.governance.legal_tradition}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Stability</dt>
                <dd className="font-medium">
                  {data.governance.stability_score_0_1.toFixed(2)} / 1.00
                </dd>
              </div>
            </dl>
          </InfoCard>

          <InfoCard title="Culture" className="h-full">
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-400">Dominant Values: </span>
                <span className="font-medium">{data.culture.dominant_values.join(', ')}</span>
              </p>

              <div>
                <h4 className="text-sm font-semibold text-green-400">Fusion Opportunities</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-300">
                  {data.culture.fusion_opportunities.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-red-400">Likely Frictions</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-300">
                  {data.culture.likely_frictions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <p className="text-gray-300">
                <span className="font-semibold text-gray-200">Holiday Notes: </span>
                <TextWithCitations
                  text={data.culture.holiday_calendar_notes}
                  sources={data.sources}
                />
              </p>
            </div>
          </InfoCard>
        </aside>
      </div>

      {/* Bottom: Assumptions + Sources */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoCard title="Assumptions">
          {data.assumptions?.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300">
              {data.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No assumptions provided.</p>
          )}
        </InfoCard>

        <InfoCard title="Sources">
          {data.sources?.length ? (
            <ul className="space-y-2 text-sm">
              {data.sources.map((s) => (
                <li key={s.id} className="truncate">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline-offset-2 hover:underline"
                    title={s.title}
                  >
                    [{s.id}] {s.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No sources provided.</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
};

export default ResultDisplay;
