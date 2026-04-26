import { STORAGE_KEYS } from "../config/api.config";
import { makeAppError } from "./offlineDb";

// Enums
export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// Types
export interface RegisterData {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: Gender;
  password: string;
  re_password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface VerifyEmailData {
  uid: string;
  token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  uid: string;
  token: string;
  new_password: string;
  re_new_password: string;
}

export interface UserData {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: Gender;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Auth Service
class AuthService {
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private sanitizeUserData(data: any): UserData {
    return {
      id: data.id,
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      gender: data.gender as Gender,
      role: data.role as UserRole,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // Register new user
  async register(data: RegisterData): Promise<{ id: number; email: string }> {
    if (!this.validateEmail(data.email)) {
      throw makeAppError("Invalid email format", {
        detail: "Invalid email format",
      });
    }
    if (data.password !== data.re_password) {
      throw makeAppError("Passwords do not match", {
        detail: "Passwords do not match",
      });
    }

    const now = new Date().toISOString();
    const user: UserData = {
      id: Date.now(),
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      gender: data.gender,
      role: UserRole.USER,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { id: user.id, email: user.email };
  }

  // Verify email with uid and token
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    // Offline: no-op
    void data;
  }

  // Login
  async login(data: LoginData): Promise<LoginResponse> {
    if (!this.validateEmail(data.email)) {
      throw makeAppError("Invalid email format", {
        detail: "Invalid email format",
      });
    }
    void data.password;

    const response: LoginResponse = {
      access: "offline-access",
      refresh: "offline-refresh",
    };
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh);

    const existing = this.getUser();
    if (!existing || existing.email !== data.email) {
      const now = new Date().toISOString();
      const user: UserData = {
        id: Date.now(),
        email: data.email,
        firstname: "Offline",
        lastname: "User",
        phone: "",
        gender: Gender.OTHER,
        role: UserRole.USER,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return response;
  }

  // Get current user info
  async getCurrentUser(): Promise<UserData> {
    const user = this.getUser();
    if (!user) {
      throw makeAppError("Not authenticated", {
        detail: "Not authenticated",
        statusCode: 401,
      });
    }
    return user;
  }

  // Forgot password - send reset email
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    if (!this.validateEmail(data.email)) {
      throw makeAppError("Invalid email format", {
        detail: "Invalid email format",
      });
    }
    // Offline: no-op
  }

  // Reset password confirm with uid and token
  async resetPassword(data: ResetPasswordData): Promise<void> {
    if (data.new_password !== data.re_new_password) {
      throw makeAppError("Passwords do not match", {
        detail: "Passwords do not match",
      });
    }
    if (data.new_password.length < 6) {
      throw makeAppError("Password must be at least 6 characters", {
        detail: "Password must be at least 6 characters",
      });
    }
    // Offline: no-op
  }

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Get user from localStorage
  getUser(): UserData | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return null;

      const userData = JSON.parse(userStr);
      return this.sanitizeUserData(userData);
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === UserRole.ADMIN;
  }

  // Get user role
  getUserRole(): UserRole | null {
    const user = this.getUser();
    return user?.role || null;
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }
}

const authService = new AuthService();
export default authService;
