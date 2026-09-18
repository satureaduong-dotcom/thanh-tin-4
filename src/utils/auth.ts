import { UserAccount, UserRole } from '../types';
import { syncAccountToSupabase } from './supabaseSync';

const ACCOUNTS_STORAGE_KEY = 'thcs_accounts_v1';
const CURRENT_USER_KEY = 'thcs_current_user_v1';
const REMEMBER_ME_KEY = 'thcs_remember_me_v1';

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin',
    username: 'admin',
    fullName: 'Thầy Trần Văn Bình',
    email: 'admin.thcs@edu.vn',
    phone: '0903123456',
    password: 'admin',
    role: 'admin',
    roleTitle: 'Ban Giám Hiệu & Quản Trị',
    subject: 'Quản lý chung',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user_gvcn',
    username: 'giaovien',
    fullName: 'Thầy Nguyễn Văn An',
    email: 'nguyenvanan.gv@edu.vn',
    phone: '0912345678',
    password: '123',
    role: 'teacher_homeroom',
    roleTitle: 'Giáo Viên Chủ Nhiệm 6A1',
    assignedClass: '6A1',
    subject: 'Toán học',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user_gvbm',
    username: 'cotoan',
    fullName: 'Cô Trần Thị Mai',
    email: 'tranthimai.gv@edu.vn',
    phone: '0987654321',
    password: '123',
    role: 'teacher_subject',
    roleTitle: 'Giáo Viên Bộ Môn',
    subject: 'Ngữ văn',
    createdAt: '2026-09-01T08:00:00Z',
  },
];

// Helper to get all accounts from localStorage
export function getStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      // First time initialization with default accounts
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ACCOUNTS;
  } catch (err) {
    console.error('Error loading accounts:', err);
    return DEFAULT_ACCOUNTS;
  }
}

// Helper to save accounts
export function saveAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

// Get currently logged-in user
export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading current user:', err);
    return null;
  }
}

// Set current logged in user
export function setCurrentUser(user: UserAccount | null, rememberMe: boolean = true): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  } catch (err) {
    console.error('Error setting current user:', err);
  }
}

// Login verification
export function authenticateUser(
  usernameOrEmail: string,
  passwordInput: string
): { success: boolean; user?: UserAccount; message: string } {
  const accounts = getStoredAccounts();
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  const user = accounts.find(
    (u) =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput
  );

  if (!user) {
    return {
      success: false,
      message: 'Tài khoản hoặc email không tồn tại trong hệ thống!',
    };
  }

  // Check password (simple comparison for local auth)
  if (user.password !== passwordInput) {
    return {
      success: false,
      message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!',
    };
  }

  // Update lastLogin
  const updatedUser: UserAccount = {
    ...user,
    lastLogin: new Date().toISOString(),
  };

  const updatedAccounts = accounts.map((a) => (a.id === user.id ? updatedUser : a));
  saveAccounts(updatedAccounts);
  syncAccountToSupabase(updatedUser);

  return {
    success: true,
    user: updatedUser,
    message: 'Đăng nhập thành công!',
  };
}

// Register new account
export function registerUser(newAccount: {
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  role?: UserRole;
  roleTitle?: string;
  subject?: string;
  assignedClass?: string;
}): { success: boolean; user?: UserAccount; message: string } {
  const accounts = getStoredAccounts();
  const cleanUsername = newAccount.username.trim().toLowerCase();
  const cleanEmail = newAccount.email?.trim().toLowerCase() || '';

  // Validate duplicate username
  if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return {
      success: false,
      message: `Tên đăng nhập "${newAccount.username}" đã được sử dụng. Vui lòng chọn tên khác!`,
    };
  }

  // Validate duplicate email if provided
  if (cleanEmail && accounts.some((a) => a.email && a.email.toLowerCase() === cleanEmail)) {
    return {
      success: false,
      message: `Email "${newAccount.email}" đã được đăng ký tài khoản trong hệ thống!`,
    };
  }

  const role: UserRole = newAccount.role || 'teacher_homeroom';

  // Determine display role title
  let roleTitle = newAccount.roleTitle;
  if (!roleTitle) {
    switch (role) {
      case 'admin':
      case 'principal':
        roleTitle = 'Ban Giám Hiệu & Quản Trị';
        break;
      case 'teacher_homeroom':
        roleTitle = newAccount.assignedClass
          ? `Giáo Viên Chủ Nhiệm ${newAccount.assignedClass}`
          : 'Giáo Viên';
        break;
      case 'teacher_subject':
        roleTitle = newAccount.subject
          ? `Giáo Viên Bộ Môn (${newAccount.subject})`
          : 'Giáo Viên Bộ Môn';
        break;
      case 'staff':
        roleTitle = 'Cán Bộ Giáo Vụ & Thiết Bị';
        break;
      default:
        roleTitle = 'Giáo Viên';
    }
  }

  const createdUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    fullName: newAccount.fullName.trim(),
    email: cleanEmail || `${cleanUsername}@thcs.edu.vn`,
    phone: newAccount.phone?.trim() || undefined,
    password: newAccount.password,
    role,
    roleTitle,
    subject: newAccount.subject?.trim() || undefined,
    assignedClass: newAccount.assignedClass?.trim() || undefined,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, createdUser];
  saveAccounts(updatedAccounts);
  syncAccountToSupabase(createdUser);

  return {
    success: true,
    user: createdUser,
    message: 'Đăng ký tài khoản thành công!',
  };
}

// Update password
export function updatePassword(
  userId: string,
  oldPass: string,
  newPass: string
): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((a) => a.id === userId);

  if (userIndex === -1) {
    return { success: false, message: 'Không tìm thấy thông tin tài khoản!' };
  }

  if (accounts[userIndex].password !== oldPass) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  accounts[userIndex] = {
    ...accounts[userIndex],
    password: newPass,
  };

  saveAccounts(accounts);
  syncAccountToSupabase(accounts[userIndex]);

  // Update current user if matches
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(accounts[userIndex]);
  }

  return { success: true, message: 'Đổi mật khẩu thành công!' };
}

// Reset password for demo or recovery
export function resetPassword(
  usernameOrEmail: string,
  newPass: string = '123'
): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  const userIndex = accounts.findIndex(
    (a) =>
      a.username.toLowerCase() === cleanInput ||
      a.email.toLowerCase() === cleanInput
  );

  if (userIndex === -1) {
    return { success: false, message: 'Không tìm thấy tài khoản với thông tin đã cung cấp!' };
  }

  accounts[userIndex] = {
    ...accounts[userIndex],
    password: newPass,
  };

  saveAccounts(accounts);
  return {
    success: true,
    message: `Đã đặt lại mật khẩu cho tài khoản "${accounts[userIndex].username}" thành: ${newPass}`,
  };
}
