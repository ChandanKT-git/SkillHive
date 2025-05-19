import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend = null, 
  trendValue = null, 
  trendLabel = null,
  isLoading = false 
}) => {
  let trendColor = 'text-gray-500 dark:text-gray-400';
  let TrendIcon = null;
  
  if (trend === 'up') {
    trendColor = 'text-green-600 dark:text-green-400';
    TrendIcon = ArrowUpRight;
  } else if (trend === 'down') {
    trendColor = 'text-red-600 dark:text-red-400';
    TrendIcon = ArrowDownRight;
  }

  return (
    <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {isLoading ? (
              <div className="h-5 w-24 skeleton rounded"></div>
            ) : (
              title
            )}
          </h3>
          {icon && !isLoading && (
            <div className={`bg-${icon.bgColor}-100 dark:bg-${icon.bgColor}-900 rounded-full p-2`}>
              {icon.component}
            </div>
          )}
          {isLoading && (
            <div className="w-9 h-9 skeleton rounded-full"></div>
          )}
        </div>
        <div className="flex items-baseline">
          {isLoading ? (
            <div className="h-8 w-16 skeleton rounded"></div>
          ) : (
            <span className="text-3xl font-bold">{value}</span>
          )}
          
          {(trend || trendValue) && !isLoading && (
            <span className={`ml-2 text-sm ${trendColor} flex items-center`}>
              {TrendIcon && <TrendIcon className="mr-1 h-3 w-3" />}
              {trendValue && <span>{trendValue}</span>}
              {trendLabel && <span className="ml-1">{trendLabel}</span>}
            </span>
          )}
          
          {(trend || trendValue) && isLoading && (
            <div className="ml-2 h-4 w-20 skeleton rounded"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
