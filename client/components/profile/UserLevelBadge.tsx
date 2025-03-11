import React from 'react';
import { UserLevel } from '../../utils/userLevel';

interface UserLevelBadgeProps {
  userLevel: UserLevel;
}

const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({ userLevel }) => {
  // Valeurs par défaut si les propriétés ne sont pas disponibles
  const level = userLevel.level || 1;
  const title = userLevel.title || 'Niveau 1';
  const color = userLevel.color || '#4f46e5';
  const progress = userLevel.progress || 0;
  const currentPoints = userLevel.currentPoints || 0;
  const nextLevelPoints = userLevel.nextLevelPoints || 100;

  return (
    <div className="flex flex-col items-center bg-slate-800 rounded-lg p-4 shadow-md w-full">
      <div className="flex items-center mb-2">
        <span className="text-sm font-medium mr-2">Niveau</span>
        <span 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold" 
          style={{ backgroundColor: color }}
        >
          {level}
        </span>
      </div>
      
      <div className="text-center mb-2">
        <span 
          className="text-lg font-semibold" 
          style={{ color: color }}
        >
          {title}
        </span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mt-1 mb-1">
        <div 
          className="h-2 rounded-full" 
          style={{ 
            width: `${progress}%`,
            backgroundColor: color 
          }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-400 mt-1">
        {level < 10 ? (
          <>
            {currentPoints} / {nextLevelPoints} points
          </>
        ) : (
          <>
            {currentPoints} points (Niveau Maximum)
          </>
        )}
      </div>
    </div>
  );
};

export default UserLevelBadge;
