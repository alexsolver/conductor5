import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

// Main Avatar component
const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  name = '', 
  size = 'md', 
  className = '',
  children
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className="${sizeClasses[size]} rounded-full overflow-hidden ">
      {children}
    </div>
  );
};

// Avatar Image component
const AvatarImage: React.FC<{ src?: string; alt?: string; className?: string }> = ({ 
  src, 
  alt, 
  className = '' 
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover ""
      />
    );
  }
  return null;
};

// Avatar Fallback component
const AvatarFallback: React.FC<{ name?: string; className?: string; children?: React.ReactNode }> = ({ 
  name = '', 
  className = '',
  children 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center text-white font-medium ${getBackgroundColor(name)} ""
    >
      {children || getInitials(name)}
    </div>
  );
};

// Simple Avatar component for our use case
const SimpleAvatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  name = '', 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className="${sizeClasses[size]} rounded-full object-cover ""
      />
    );
  }

  return (
    <div
      className="${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${getBackgroundColor(name)} ""
    >
      {getInitials(name)}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback };
export default SimpleAvatar;