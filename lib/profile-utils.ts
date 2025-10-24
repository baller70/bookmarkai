// Profile utility functions for consistent profile picture handling across the app
// Sentry removed
import { appLogger } from '@/lib/logger'

export const getProfilePicture = (): string => {
  if (typeof window === 'undefined') {
    return '/default-profile.png';
  }

  // First check for DNA profile avatar (highest priority)
  const dnaProfileAvatar = localStorage.getItem('dna_profile_avatar');
  if (dnaProfileAvatar) {
    return dnaProfileAvatar;
  }

  // Second check for profile picture from settings
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.profile?.avatar) {
        return settings.profile.avatar;
      }
    } catch (error) {
      console.warn('Error loading profile avatar from settings', error);
    }
  }

  // Fallback to direct profilePicture key
  const profilePicture = localStorage.getItem('profilePicture');
  return profilePicture || '/default-profile.png';
};

export const getUserName = (): string => {
  if (typeof window === 'undefined') {
    return 'User';
  }

  // First check for user name from settings
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.profile?.name) {
        return settings.profile.name;
      }
    } catch (error) {
      appLogger.warn('Error loading user name from settings', error);
    }
  }

  // Fallback to direct userName key
  return localStorage.getItem('userName') || 'User';
};

export const getUserInitial = (): string => {
  const userName = getUserName();
  return userName.charAt(0).toUpperCase();
};

// Listen for profile picture changes and notify components
export const onProfilePictureChange = (callback: (newPicture: string) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleStorageChange = (e: StorageEvent) => {
    try {
      if (e.key === 'userSettings') {
        if (e.newValue) {
          const settings = JSON.parse(e.newValue);
          if (settings.profile?.avatar) {
            callback(settings.profile.avatar);
            return;
          }
        }
        // Avatar removed from userSettings
        callback('');
        return;
      }

      if (e.key === 'profilePicture') {
        // When key removed, newValue is null => treat as cleared
        callback(e.newValue || '');
        return;
      }

      if (e.key === 'dna_profile_avatar') {
        // DNA avatar explicitly changed/removed
        callback(e.newValue || '');
        return;
      }
    } catch (error) {
      appLogger.warn('Error handling profile picture change', error);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
};