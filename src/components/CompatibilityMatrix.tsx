import React from 'react';

interface MatrixRow {
  feature: string;
  score_0_1: number;
  note: string;
}

interface CompatibilityMatrixProps {
  matrix: MatrixRow[];
}

const CompatibilityMatrix: React.FC<CompatibilityMatrixProps> = ({ matrix }) => {

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th scope="col" className="px-4 py-3">Feature</th>
            <th scope="col" className="px-4 py-3 text-center">Compatibility Score</th>
            <th scope="col" className="px-4 py-3">Note</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, index) => (
            <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="px-4 py-3 font-medium text-white">{row.feature}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className={`${getScoreColor(row.score_0_1)} h-2.5 rounded-full`} style={{width: `${row.score_0_1 * 100}%`}}></div>
                    </div>
                    <span className="font-bold text-white">{row.score_0_1.toFixed(2)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompatibilityMatrix;
