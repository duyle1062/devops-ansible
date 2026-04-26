import { UserData, Gender } from "./auth.service";
import authService from "./auth.service";
import { STORAGE_KEYS } from "../config/api.config";
import { makeAppError } from "./offlineDb";

// Types
export interface UpdateProfileData {
  firstname?: string;
  lastname?: string;
  gender?: Gender;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  data?: UserData;
  errors?: any;
}

// User Service
class UserService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserData> {
    const user = authService.getUser();
    if (!user) {
      throw makeAppError("Not authenticated", {
        detail: "Not authenticated",
        statusCode: 401,
      });
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserData> {
    const current = authService.getUser();
    if (!current) {
      throw makeAppError("Not authenticated", {
        detail: "Not authenticated",
        statusCode: 401,
      });
    }
    const updated: UserData = {
      ...current,
      ...data,
      gender: (data.gender as Gender) ?? current.gender,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    // Offline: accept request; extendable to store password locally
    void data;
  }
}

const userService = new UserService();
export default userService;
