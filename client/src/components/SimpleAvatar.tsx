
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SimpleAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ 
  src, 
  name = '', 
  size = 'md',
  className = '' 
}) => {
  // ✅ 1QA.MD COMPLIANCE: Handle different avatar sizes following design patterns
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm', 
    lg: 'h-10 w-10 text-base'
  };

  // ✅ 1QA.MD COMPLIANCE: Generate initials from name following user display patterns
  const getInitials = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first name and first letter of last name
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // ✅ 1QA.MD COMPLIANCE: Construct full image URL if src is a relative path
  const getImageUrl = (imageSrc?: string | null): string | undefined => {
    if (!imageSrc || imageSrc === 'null' || imageSrc === 'undefined') {
      return undefined;
    }
    
    // If it's already a full URL, return as is
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }
    
    // If it's a relative path, construct full URL
    if (imageSrc.startsWith('/')) {
      return `${window.location.origin}${imageSrc";
    }
    
    return imageSrc;
  };

  const imageUrl = getImageUrl(src);
  const initials = getInitials(name);

  return (
    <Avatar className="${sizeClasses[size]} "`}>
      {imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={name || 'User avatar'}
          className="object-cover"
          onError={(e) => {
            // ✅ 1QA.MD COMPLIANCE: Handle image load errors gracefully
            console.warn('Avatar image failed to load:', imageUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <AvatarFallback className="bg-blue-500 text-white font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default SimpleAvatar;
