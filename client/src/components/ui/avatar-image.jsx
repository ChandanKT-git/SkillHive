import { useState } from 'react';
import { Avatar, AvatarImage as BaseAvatarImage, AvatarFallback } from '@/components/ui/avatar';

const CustomAvatarImage = ({ src, alt, className, size = "md", fallback }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Get initials for fallback
  const getInitials = () => {
    if (!alt) return "?";
    return alt
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      {!error && src && (
        <BaseAvatarImage src={src} alt={alt} onError={handleError} />
      )}
      <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 font-medium">
        {fallback || getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default CustomAvatarImage;
