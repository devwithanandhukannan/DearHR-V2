export const ROLES = {
  JOB_SEEKER:     1 << 0,  // 1
  PLATFORM_ADMIN: 1 << 1,  // 2
} as const;

export const ROLE_NAMES: Record<number, string> = {
  [ROLES.JOB_SEEKER]:     'Job Seeker',
  [ROLES.PLATFORM_ADMIN]: 'Platform Admin',
};