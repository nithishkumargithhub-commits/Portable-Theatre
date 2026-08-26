import React from 'react';

// avatar_url with dicebear fallback
export function UserAvatar({ username, avatarUrl, size = 'md', className = '', showRing = false }) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  const ringClass = showRing ? 'ring-2 ring-indigo-500/50 ring-offset-1 ring-offset-background' : '';
  const src = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'user')}`;

  return (
    <img
      src={src}
      alt={username || 'User'}
      className={`${sizes[size]} rounded-xl bg-surface-light border border-slate-700/50 object-cover ${ringClass} ${className}`}
    />
  );
}
