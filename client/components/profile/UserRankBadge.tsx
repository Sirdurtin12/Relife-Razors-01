import React from 'react';
import { UserRank } from '../../utils/userLevel';
import StarRating from './StarRating';

interface UserRankBadgeProps {
  userRank: UserRank;
}

const UserRankBadge: React.FC<UserRankBadgeProps> = ({ userRank }) => {
  return (
    <div className="flex flex-col items-center rounded-lg p-4 w-full">
      <div className="mb-3">
        <StarRating rating={userRank.stars} size="lg" />
      </div>
      
      <div className="text-center mb-3">
        <span className="text-lg font-semibold text-black dark:text-white">
          {userRank.title}
        </span>
      </div>
      
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
        <div 
          className="h-2 rounded-full bg-amber-500" 
          style={{ width: `${userRank.progress}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {userRank.stars < 5 ? (
          <>
            {userRank.currentPoints} / {userRank.nextStarPoints} points 
            <span className="ml-1">
              ({userRank.stars < 5 ? `${userRank.progress}% vers la prochaine étoile` : 'Maximum atteint'})
            </span>
          </>
        ) : (
          <>
            {userRank.currentPoints} points (Rang maximum atteint)
          </>
        )}
      </div>
    </div>
  );
};

export default UserRankBadge;
