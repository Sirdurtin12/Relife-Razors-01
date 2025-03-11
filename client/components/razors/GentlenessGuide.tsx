import React from 'react';

type GentlenessGuideProps = {
  className?: string;
  compact?: boolean;
};

const GentlenessGuide: React.FC<GentlenessGuideProps> = ({ 
  className = '',
  compact = false
}) => {
  const gentlenessLevels = [
    { range: '1-3', label: 'Très doux', color: '#fff176' },
    { range: '4-7', label: 'Doux', color: '#f9bd59' },
    { range: '8-12', label: 'Intermédiaire', color: '#e8863b' },
    { range: '13-17', label: 'Agressif', color: '#d03c1f' },
    { range: '18-20', label: 'Très agressif', color: '#7e0404' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Guide de douceur</h3>
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3'}`}>
        {gentlenessLevels.map((level) => (
          <div key={level.range} className="flex items-center">
            <span 
              className="inline-block w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: level.color }}
            ></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{level.range}</span>: {level.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GentlenessGuide;
