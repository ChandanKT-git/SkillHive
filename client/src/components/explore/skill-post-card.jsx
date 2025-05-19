import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkPlus, Star } from 'lucide-react';
import AvatarImage from '../ui/avatar-image';

const SkillPostCard = ({ 
  skillPost, 
  isBookmarked = false, 
  onClick,
  onBookmark,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="h-48 w-full skeleton"></div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="h-6 w-40 skeleton rounded mb-1"></div>
              <div className="h-4 w-56 skeleton rounded"></div>
            </div>
            <div className="h-6 w-6 skeleton rounded-full"></div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 skeleton rounded-full"></div>
              <div className="ml-2 h-4 w-24 skeleton rounded"></div>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-12 skeleton rounded"></div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-6 w-16 skeleton rounded-full"></div>
            <div className="h-6 w-24 skeleton rounded-full"></div>
            <div className="h-6 w-20 skeleton rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    onBookmark && onBookmark(skillPost);
  };

  return (
    <Card 
      className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer"
      onClick={() => onClick && onClick(skillPost)}
    >
      <img 
        className="h-48 w-full object-cover" 
        src={skillPost.imageUrl} 
        alt={skillPost.title} 
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{skillPost.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{skillPost.description}</p>
          </div>
          <button 
            className={isBookmarked ? "text-primary-500 dark:text-primary-400" : "text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"}
            onClick={handleBookmarkClick}
          >
            {isBookmarked ? (
              <Bookmark className="h-6 w-6" />
            ) : (
              <BookmarkPlus className="h-6 w-6" />
            )}
          </button>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center">
            <AvatarImage
              src={skillPost.mentor.avatar}
              alt={skillPost.mentor.name}
              size="sm"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {skillPost.mentor.name}
            </span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              {skillPost.rating.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {skillPost.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs font-medium">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillPostCard;
