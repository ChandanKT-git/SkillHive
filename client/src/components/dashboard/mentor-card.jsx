import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import AvatarImage from '../ui/avatar-image';

const MentorCard = ({ 
  mentor, 
  onClick, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 flex flex-col items-center text-center p-5">
        <div className="h-16 w-16 skeleton rounded-full mb-3"></div>
        <div className="h-5 w-32 skeleton rounded mb-1"></div>
        <div className="h-4 w-40 skeleton rounded mb-3"></div>
        <div className="h-4 w-24 skeleton rounded mb-3"></div>
        <div className="flex space-x-2 mb-4">
          <div className="h-6 w-16 skeleton rounded-full"></div>
          <div className="h-6 w-16 skeleton rounded-full"></div>
        </div>
        <div className="h-4 w-24 skeleton rounded"></div>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 flex flex-col items-center text-center p-5 hover:shadow-md cursor-pointer"
      onClick={() => onClick && onClick(mentor)}
    >
      <AvatarImage
        src={mentor.avatar}
        alt={mentor.name}
        size="lg"
        className="mb-3"
      />
      <h3 className="font-medium text-gray-900 dark:text-white">{mentor.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{mentor.skills.join(' • ')}</p>
      <div className="flex items-center mb-3">
        <Star className="text-yellow-500 h-4 w-4" />
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {mentor.rating}
        </span>
        <span className="mx-1 text-gray-400">•</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {mentor.sessionCount} sessions
        </span>
      </div>
      <div className="flex space-x-2 mb-4">
        {mentor.tags.slice(0, 2).map((tag, idx) => (
          <Badge key={idx} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
      <button className="text-primary-500 dark:text-primary-400 hover:underline text-sm font-medium">
        View Profile
      </button>
    </Card>
  );
};

export default MentorCard;
