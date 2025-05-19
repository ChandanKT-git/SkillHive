import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Bookmark, BookmarkPlus, User } from 'lucide-react';
import AvatarImage from '../ui/avatar-image';
import { Link } from 'wouter';

const SkillCard = ({ 
  skill, 
  isBookmarked = false, 
  onClick, 
  isLoading = false,
  isOwnSkill = false,
  onToggleActive,
  onEdit
}) => {
  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    // Handle bookmark toggle
  };

  const handleCardClick = () => {
    if (onClick) onClick(skill);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="flex">
            <div className="h-20 w-24 skeleton rounded-md mr-4"></div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div className="h-5 w-40 skeleton rounded mb-1"></div>
                <div className="h-5 w-5 skeleton rounded-full"></div>
              </div>
              <div className="h-4 w-24 skeleton rounded mb-2"></div>
              <div className="flex space-x-1 mt-2 mb-3">
                <div className="h-6 w-16 skeleton rounded-full"></div>
                <div className="h-6 w-20 skeleton rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-5 w-5 skeleton rounded-full mr-1"></div>
                  <div className="h-4 w-24 skeleton rounded"></div>
                </div>
                <div className="h-4 w-16 skeleton rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isOwnSkill) {
    return (
      <Card className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 dark:text-white">{skill.title}</h3>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">
                {skill.active ? 'Active' : 'Inactive'}
              </span>
              <div className="relative inline-block w-10 align-middle select-none">
                <input 
                  type="checkbox" 
                  id={`toggle-${skill.id}`} 
                  checked={skill.active} 
                  onChange={() => onToggleActive(skill)}
                  className="sr-only"
                />
                <label 
                  htmlFor={`toggle-${skill.id}`}
                  className={`block overflow-hidden h-5 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer 
                    after:absolute after:z-[1] after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                    ${skill.active ? 'bg-primary-500 after:translate-x-5 border-primary-500' : ''}`}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap mt-2">
            {skill.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="mr-1 mb-1">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{skill.description}</p>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center">
              <User className="text-gray-400 mr-1 h-4 w-4" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{skill.learnerCount} learners</span>
            </div>
            <div className="flex items-center">
              <Star className="text-yellow-500 h-4 w-4 mr-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {skill.rating} ({skill.reviewCount} reviews)
              </span>
            </div>
            <button 
              onClick={() => onEdit(skill)}
              className="text-primary-500 dark:text-primary-400 hover:underline text-xs font-medium"
            >
              Edit
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-sm dark:shadow-none dark-shadow transition-all duration-200 hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex">
          <img 
            src={skill.imageUrl} 
            alt={skill.title}
            className="h-20 w-24 object-cover rounded-md mr-4" 
          />
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">{skill.title}</h3>
              <button 
                onClick={handleBookmarkClick}
                className={isBookmarked ? "text-primary-500" : "text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"}
              >
                {isBookmarked ? <Bookmark className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.floor(skill.rating) 
                        ? "text-yellow-500 fill-yellow-500" 
                        : star <= skill.rating
                          ? "text-yellow-500 fill-yellow-500" // Could implement half-star
                          : "text-yellow-500 fill-transparent"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({skill.reviewCount} reviews)
              </span>
            </div>
            <div className="flex flex-wrap mt-2">
              {skill.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="mr-1 mb-1">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <AvatarImage 
                  src={skill.mentor.avatar} 
                  alt={skill.mentor.name}
                  size="sm"
                  className="mr-1"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{skill.mentor.name}</span>
              </div>
              <Link 
                href={`/skill/${skill.id}`}
                className="text-primary-500 dark:text-primary-400 hover:underline text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillCard;
