import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 h-full">
      <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-600 pb-2">{title}</h3>
      <div className="text-gray-300 space-y-2 text-sm md:text-base">
        {children}
      </div>
    </div>
  );
};

export default InfoCard;
