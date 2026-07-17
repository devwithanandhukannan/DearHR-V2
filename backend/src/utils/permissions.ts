// src/utils/permissions.ts

import { ROLES, ROLE_NAMES } from '../constants/roles.ts';

export class PermissionHelper {
  /**
   * Check if user has a specific role
   */
  static hasRole(userRoles: number, role: number): boolean {
    return (userRoles & role) === role;
  }

  /**
   * Add a role to user's roles
   */
  static addRole(userRoles: number, role: number): number {
    return userRoles | role;
  }

  /**
   * Remove a role from user's roles
   */
  static removeRole(userRoles: number, role: number): number {
    return userRoles & ~role;
  }

  /**
   * Check if user has ANY of the specified roles
   */
  static hasAnyRole(userRoles: number, roles: number[]): boolean {
    return roles.some((role) => this.hasRole(userRoles, role));
  }

  /**
   * Check if user has ALL of the specified roles
   */
  static hasAllRoles(userRoles: number, roles: number[]): boolean {
    return roles.every((role) => this.hasRole(userRoles, role));
  }

  /**
   * Get array of role names from bitwise roles
   */
  static getRolesArray(userRoles: number): string[] {
    const roles: string[] = [];
    Object.entries(ROLES).forEach(([key, value]) => {
      if (this.hasRole(userRoles, value)) {
        roles.push(key);
      }
    });
    return roles;
  }

  /**
   * Get human-readable role names
   */
  static getRoleNames(userRoles: number): string[] {
    const names: string[] = [];
    Object.entries(ROLES).forEach(([_, value]) => {
      if (this.hasRole(userRoles, value)) {
        const roleName = ROLE_NAMES[value];
        if (roleName) {
          names.push(roleName);
        }
      }
    });
    return names;
  }

  /**
   * Convert role names to bitwise value
   */
  static rolesToBits(roleNames: string[]): number {
    return roleNames.reduce((bits, name) => {
      const roleKey = name.toUpperCase().replace(/ /g, '_');
      const roleValue = ROLES[roleKey as keyof typeof ROLES];
      return roleValue ? bits | roleValue : bits;
    }, 0);
  }

  /**
   * Check if user is platform admin
   */
  static isPlatformAdmin(userRoles: number): boolean {
    return this.hasRole(userRoles, ROLES.PLATFORM_ADMIN);
  }
}