import React from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const Badge = ({ icon, title, color }) => {
  return (
    <div title={title} className={`w-8 h-8 rounded-full bg-${color}-100 dark:bg-${color}-800 border-2 border-white dark:border-gray-800 flex items-center justify-center`}>
      {icon}
    </div>
  );
};

const ProgressItem = ({ label, value, max, color = "primary", description, isLoading = false }) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading ? (
            <div className="h-4 w-24 skeleton rounded"></div>
          ) : (
            label
          )}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading ? (
            <div className="h-4 w-10 skeleton rounded"></div>
          ) : (
            `${value}/${max}`
          )}
        </span>
      </div>
      {isLoading ? (
        <div className="h-2.5 w-full skeleton rounded-full"></div>
      ) : (
        <Progress value={percentage} className={`bg-gray-200 dark:bg-gray-700 h-2.5`} />
      )}
      {description && !isLoading && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {description && isLoading && (
        <div className="mt-1 h-3 w-32 skeleton rounded"></div>
      )}
    </div>
  );
};

const AchievementItem = ({ icon, title, description, isLoading = false }) => {
  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 rounded p-3">
      {isLoading ? (
        <div className="w-8 h-8 skeleton rounded-full mr-3"></div>
      ) : (
        <div className="bg-gray-200 dark:bg-gray-600 rounded-full p-2 mr-3">
          {icon}
        </div>
      )}
      <div>
        {isLoading ? (
          <>
            <div className="h-4 w-32 skeleton rounded mb-1"></div>
            <div className="h-3 w-20 skeleton rounded"></div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </>
        )}
      </div>
    </div>
  );
};

const ProgressTracker = ({ 
  title = "Your Progress",
  level,
  xpCurrent,
  xpNext,
  achievements = [],
  badges = [],
  nextAchievements = [],
  isLoading = false
}) => {
  return (
    <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {!isLoading && level && (
              <CardDescription>Level {level.number}: {level.title}</CardDescription>
            )}
            {isLoading && (
              <div className="h-4 w-36 skeleton rounded mt-1"></div>
            )}
          </div>
          
          {!isLoading && badges.length > 0 && (
            <div className="mt-3 md:mt-0 flex space-x-2">
              <div className="flex -space-x-2">
                {badges.map((badge, index) => (
                  <Badge key={index} icon={badge.icon} title={badge.title} color={badge.color} />
                ))}
              </div>
              <button className="text-primary-500 dark:text-primary-400 hover:underline text-sm font-medium">
                View All
              </button>
            </div>
          )}
          
          {isLoading && (
            <div className="mt-3 md:mt-0 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 skeleton rounded-full border-2 border-white dark:border-gray-800"></div>
                ))}
              </div>
              <div className="ml-2 h-4 w-16 skeleton rounded"></div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* XP Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            {isLoading ? (
              <>
                <div className="h-4 w-12 skeleton rounded"></div>
                <div className="h-4 w-36 skeleton rounded"></div>
              </>
            ) : (
              <>
                <span>{xpCurrent} XP</span>
                <span>{xpNext} XP needed for Level {level?.number + 1 || 1}</span>
              </>
            )}
          </div>
          {isLoading ? (
            <div className="h-3 skeleton rounded-full"></div>
          ) : (
            <Progress value={(xpCurrent / xpNext) * 100} className="h-3" />
          )}
        </div>
        
        {/* Next achievements */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            Array(3).fill().map((_, i) => (
              <AchievementItem key={i} isLoading={true} />
            ))
          ) : (
            nextAchievements.map((achievement, index) => (
              <AchievementItem
                key={index}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
