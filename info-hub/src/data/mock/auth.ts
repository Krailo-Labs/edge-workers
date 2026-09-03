import { create } from 'zustand';
import { UserProfile, UserRole, PRESET_USERS, DEFAULT_PERMISSIONS, SystemPermissionsConfig, VisibilityMode } from '@/shared/config/permissions';

interface AuthState {
  currentUser: UserProfile;
  permissionsConfig: SystemPermissionsConfig;
  isAdmin: boolean;
  isPartner: boolean;
  
  // Actions
  setUser: (user: UserProfile) => void;
  setUserByRole: (role: UserRole) => void;
  setAdmin: (isAdmin: boolean) => void;
  updatePermissions: (newConfig: SystemPermissionsConfig) => void;
  updateRoleNavAccess: (role: UserRole, path: string, mode: VisibilityMode) => void;
  checkNavAccess: (path: string) => VisibilityMode;
  canViewContent: (visibility: 'PRIVATE' | 'SHARED' | 'PUBLIC', authorId?: string) => boolean;
}

const STORAGE_KEY_USER = 'infohub_user';
const STORAGE_KEY_PERMS = 'infohub_perms';

const getInitialUser = (): UserProfile => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return PRESET_USERS[0]; // Admin by default for initial setup
};

const getInitialPerms = (): SystemPermissionsConfig => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return DEFAULT_PERMISSIONS;
};

export const useAuth = create<AuthState>((set, get) => {
  const initialUser = getInitialUser();
  const initialPerms = getInitialPerms();

  return {
    currentUser: initialUser,
    permissionsConfig: initialPerms,
    isAdmin: initialUser.role === 'ADMIN',
    isPartner: initialUser.role === 'PARTNER',

    setUser: (user) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      }
      set({ 
        currentUser: user, 
        isAdmin: user.role === 'ADMIN',
        isPartner: user.role === 'PARTNER'
      });
    },

    setUserByRole: (role) => {
      const user = PRESET_USERS.find(u => u.role === role) || {
        id: `user-${role.toLowerCase()}`,
        name: role,
        role: role,
        avatarText: role.substring(0, 2)
      };
      get().setUser(user);
    },

    setAdmin: (isAdmin) => {
      if (isAdmin) {
        get().setUserByRole('ADMIN');
      } else {
        get().setUserByRole('GUEST');
      }
    },

    updatePermissions: (newConfig) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PERMS, JSON.stringify(newConfig));
      }
      set({ permissionsConfig: newConfig });
    },

    updateRoleNavAccess: (role, path, mode) => {
      const current = get().permissionsConfig;
      const updated: SystemPermissionsConfig = {
        roles: {
          ...current.roles,
          [role]: {
            ...current.roles[role],
            navAccess: {
              ...current.roles[role].navAccess,
              [path]: mode
            }
          }
        }
      };
      get().updatePermissions(updated);
    },

    checkNavAccess: (path) => {
      const { currentUser, permissionsConfig } = get();
      const rolePerms = permissionsConfig.roles[currentUser.role];
      if (!rolePerms) return 'VISIBLE';
      return rolePerms.navAccess[path] || 'VISIBLE';
    },

    canViewContent: (visibility, authorId) => {
      const { currentUser } = get();
      if (currentUser.role === 'ADMIN') return true;
      if (visibility === 'PUBLIC') return true;
      if (visibility === 'SHARED') {
        return currentUser.role === 'PARTNER' || currentUser.role === 'MEMBER';
      }
      if (visibility === 'PRIVATE') {
        if (currentUser.role === 'PARTNER') return true; // Partner sees private notes created for them/shared
        return currentUser.id === authorId;
      }
      return false;
    }
  };
});
