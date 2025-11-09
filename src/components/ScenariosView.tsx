import React from 'react';
import { Scenario } from '../lib/types';

interface ScenariosViewProps {
  scenarios: {
    optimistic: Scenario;
    baseline: Scenario;
    pessimistic: Scenario;
  };
}

const ScenarioCard: React.FC<{ title: string; data: Scenario; colorClass: string }> = ({ title, data, colorClass }) => {
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatPercent = (num: number) => `${num.toFixed(1)}%`;

  return (
    <div className={`bg-gray-800 p-5 rounded-lg border-l-4 ${colorClass} shadow-md`}>
      <h4 className={`text-lg font-bold ${colorClass.replace('border-', 'text-')}`}>{title}</h4>
      <p className="text-sm text-gray-400 mt-2 mb-3">{data.notes}</p>
      <div className="text-sm space-y-1">
        <p><strong>Population:</strong> {formatNumber(data.pop)}</p>
        <p><strong>GDP Growth:</strong> {formatPercent(data.gdp_growth_pct)}</p>
        <p><strong>Stability:</strong> {data.stability_0_1.toFixed(2)} / 1.0</p>
      </div>
    </div>
  );
};


const ScenariosView: React.FC<ScenariosViewProps> = ({ scenarios }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
       <h3 className="text-2xl font-bold text-white mb-4">10-Year Scenarios</h3>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScenarioCard title="Optimistic" data={scenarios.optimistic} colorClass="border-green-500" />
            <ScenarioCard title="Baseline" data={scenarios.baseline} colorClass="border-blue-500" />
            <ScenarioCard title="Pessimistic" data={scenarios.pessimistic} colorClass="border-red-500" />
       </div>
    </div>
  );
};

export default ScenariosView;
