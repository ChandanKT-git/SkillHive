import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const CategoryCard = ({ 
  category, 
  onClick,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 flex flex-col items-center justify-center p-6">
        <div className="h-12 w-12 skeleton rounded-full mb-2"></div>
        <div className="h-5 w-20 skeleton rounded mb-1"></div>
        <div className="h-4 w-16 skeleton rounded"></div>
      </Card>
    );
  }

  const { name, icon, mentorCount, color = 'blue' } = category;

  return (
    <Card 
      className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 flex flex-col items-center justify-center p-6 cursor-pointer hover:shadow-md"
      onClick={() => onClick && onClick(category)}
    >
      <div className={`h-12 w-12 rounded-full bg-${color}-100 dark:bg-${color}-900 flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <h3 className="text-md font-medium text-gray-900 dark:text-white">{name}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mentorCount} mentors</p>
    </Card>
  );
};

export default CategoryCard;
