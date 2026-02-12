import { db } from "../db";
import { users, userActivityLog } from "../../shared/schema";
import { rolePermissions, UserRole } from "../../shared/schema";
import { eq } from "drizzle-orm";

class UserManagementService {
  /**
   * Create a new user
   */
  async createUser(data: {
    username: string;
    password: string;
    email?: string;
    mobileNo: string;  // ✨ CHANGED: Required identifier
    role: UserRole;
  }): Promise<any> {
    try {
      const permissions = rolePermissions[data.role];

      const result = await db
        .insert(users)
        .values({
          mobileNo: data.mobileNo,  // ✨ CHANGED: Use mobileNo as identifier
          username: data.username,
          password: data.password,
          email: data.email,
          role: data.role,
          permissions: JSON.stringify(permissions),
          isActive: true,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  /**
   * Signup a new user
   */
  async signup(data: {
    username: string;
    password: string;
    mobileNo: string;  // ✨ CHANGED: Required identifier
  }): Promise<any> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByUsername(data.username);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      const result = await db
        .insert(users)
        .values({
          mobileNo: data.mobileNo,  // ✨ CHANGED: Use mobileNo as identifier
          username: data.username,
          password: data.password, // Note: In production, hash the password
          role: "STAFF",
          permissions: JSON.stringify(rolePermissions.STAFF),
          isActive: true,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to signup user:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<any> {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<any> {
    try {
      return await db.query.users.findFirst({
        where: eq(users.username, username),
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<any[]> {
    try {
      return await db.query.users.findMany();
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: number, newRole: UserRole): Promise<any> {
    try {
      const permissions = rolePermissions[newRole];

      const result = await db
        .update(users)
        .set({
          role: newRole,
          permissions: JSON.stringify(permissions),
          updatedAt: new Date(),
        })
        .where((field) => field.id === userId)
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update user role:", error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: number): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where((field) => field.id === userId)
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Failed to deactivate user:", error);
      return false;
    }
  }

  /**
   * Activate user
   */
  async activateUser(userId: number): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where((field) => field.id === userId)
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Failed to activate user:", error);
      return false;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: any, permission: string): boolean {
    if (!user || !user.permissions) {
      return false;
    }

    try {
      const permissions = JSON.parse(user.permissions);
      return permissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Check if user has any of the permissions
   */
  hasAnyPermission(user: any, permissions: string[]): boolean {
    return permissions.some((perm) => this.hasPermission(user, perm));
  }

  /**
   * Log user activity
   */
  async logActivity(data: {
    userId: number;
    action: string;
    module: string;
    resourceId?: number;
    changes?: any;
  }): Promise<void> {
    try {
      const mobileNo = (await db.query.users.findFirst({ where: (f, { eq }) => eq(f.id, data.userId) }))?.mobileNo ?? process.env.DEFAULT_MOBILE_NO ?? "0";

      await db.insert(userActivityLog).values({
        mobileNo,
        userId: data.userId,
        action: data.action,
        module: data.module,
        resourceId: data.resourceId,
        changes: data.changes ? JSON.stringify(data.changes) : null,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  /**
   * Get activity logs for a user
   */
  async getUserActivityLogs(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const logs = await db.query.userActivityLog.findMany({
        where: (field, { eq }) => eq(field.userId, userId),
      });

      return logs.slice(0, limit).reverse();
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      return [];
    }
  }

  /**
   * Get activity logs for a module
   */
  async getModuleActivityLogs(
    module: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const logs = await db.query.userActivityLog.findMany({
        where: (field, { eq }) => eq(field.module, module),
      });

      return logs.slice(0, limit).reverse();
    } catch (error) {
      console.error("Failed to fetch module logs:", error);
      return [];
    }
  }

  /**
   * Get audit trail (all activity logs)
   */
  async getAuditTrail(limit: number = 100): Promise<any[]> {
    try {
      const logs = await db.query.userActivityLog.findMany();
      return logs.slice(0, limit).reverse();
    } catch (error) {
      console.error("Failed to fetch audit trail:", error);
      return [];
    }
  }
}

export const userManagementService = new UserManagementService();
