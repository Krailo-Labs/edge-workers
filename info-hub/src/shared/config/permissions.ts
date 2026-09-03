export type UserRole = 'ADMIN' | 'PARTNER' | 'MEMBER' | 'GUEST';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  avatarText?: string;
}

export type VisibilityMode = 'VISIBLE' | 'BLURRED' | 'HIDDEN';

export interface RolePermissions {
  // Navigation routes access
  navAccess: Record<string, VisibilityMode>;
  // Capability flags
  canCreateContent: boolean;
  canEditAnyContent: boolean;
  canDeleteAnyContent: boolean;
  canViewPrivate: boolean;
  canAccessAdmin: boolean;
  canManageAI: boolean;
}

export interface SystemPermissionsConfig {
  roles: Record<UserRole, RolePermissions>;
}

export const DEFAULT_PERMISSIONS: SystemPermissionsConfig = {
  roles: {
    ADMIN: {
      navAccess: {
        '/': 'VISIBLE',
        '/inbox': 'VISIBLE',
        '/content?type=MATERIAL': 'VISIBLE',
        '/content?type=ARTICLE': 'VISIBLE',
        '/content?type=LESSON': 'VISIBLE',
        '/content?type=COURSE': 'VISIBLE',
        '/topics': 'VISIBLE',
        '/ai': 'VISIBLE',
        '/import': 'VISIBLE',
        '/feedback': 'VISIBLE',
        '/admin': 'VISIBLE',
      },
      canCreateContent: true,
      canEditAnyContent: true,
      canDeleteAnyContent: true,
      canViewPrivate: true,
      canAccessAdmin: true,
      canManageAI: true,
    },
    PARTNER: {
      navAccess: {
        '/': 'VISIBLE',
        '/inbox': 'VISIBLE',
        '/content?type=MATERIAL': 'VISIBLE',
        '/content?type=ARTICLE': 'VISIBLE',
        '/content?type=LESSON': 'VISIBLE',
        '/content?type=COURSE': 'VISIBLE',
        '/topics': 'VISIBLE',
        '/ai': 'VISIBLE',
        '/import': 'VISIBLE',
        '/feedback': 'VISIBLE',
        '/admin': 'BLURRED',
      },
      canCreateContent: true,
      canEditAnyContent: false, // only own content
      canDeleteAnyContent: false,
      canViewPrivate: true, // can view shared private between author & partner
      canAccessAdmin: false,
      canManageAI: true,
    },
    MEMBER: {
      navAccess: {
        '/': 'VISIBLE',
        '/inbox': 'VISIBLE',
        '/content?type=MATERIAL': 'VISIBLE',
        '/content?type=ARTICLE': 'VISIBLE',
        '/content?type=LESSON': 'VISIBLE',
        '/content?type=COURSE': 'VISIBLE',
        '/topics': 'VISIBLE',
        '/ai': 'VISIBLE',
        '/import': 'BLURRED',
        '/feedback': 'VISIBLE',
        '/admin': 'HIDDEN',
      },
      canCreateContent: true,
      canEditAnyContent: false,
      canDeleteAnyContent: false,
      canViewPrivate: false,
      canAccessAdmin: false,
      canManageAI: false,
    },
    GUEST: {
      navAccess: {
        '/': 'VISIBLE',
        '/inbox': 'BLURRED',
        '/content?type=MATERIAL': 'VISIBLE',
        '/content?type=ARTICLE': 'VISIBLE',
        '/content?type=LESSON': 'VISIBLE',
        '/content?type=COURSE': 'VISIBLE',
        '/topics': 'VISIBLE',
        '/ai': 'BLURRED',
        '/import': 'HIDDEN',
        '/feedback': 'VISIBLE',
        '/admin': 'HIDDEN',
      },
      canCreateContent: false,
      canEditAnyContent: false,
      canDeleteAnyContent: false,
      canViewPrivate: false,
      canAccessAdmin: false,
      canManageAI: false,
    },
  },
};

export const PRESET_USERS: UserProfile[] = [
  { id: 'u-admin', name: 'Олександр (Адмін)', role: 'ADMIN', email: 'admin@infohub.local', avatarText: 'AD' },
  { id: 'u-partner', name: 'Анна (Партнер / Дівчина)', role: 'PARTNER', email: 'partner@infohub.local', avatarText: 'АН' },
  { id: 'u-member', name: 'Максим (Студент / Користувач)', role: 'MEMBER', email: 'member@infohub.local', avatarText: 'MK' },
  { id: 'u-guest', name: 'Гість (Анонім)', role: 'GUEST', avatarText: 'ГС' },
];
