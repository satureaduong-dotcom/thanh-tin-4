import React, { useState } from 'react';
import { UserAccount } from '../types';
import { updatePassword } from '../utils/auth';
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Lock,
  KeyRound,
  LogOut,
  Check,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onLogout: () => void;
  onUserUpdated?: (updated: UserAccount) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword) {
      setPasswordMsg({ text: 'Vui lòng nhập mật khẩu hiện tại', isError: true });
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setPasswordMsg({ text: 'Mật khẩu mới phải có ít nhất 3 ký tự', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Xác nhận mật khẩu mới không trùng khớp', isError: true });
      return;
    }

    const res = updatePassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ text: 'Đổi mật khẩu thành công!', isError: false });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ text: res.message, isError: true });
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
      case 'principal':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: ShieldCheck,
          label: currentUser.roleTitle || 'Ban Giám Hiệu',
        };
      case 'teacher_homeroom':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: GraduationCap,
          label: currentUser.roleTitle || 'Giáo Viên Chủ Nhiệm',
        };
      default:
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: BookOpen,
          label: currentUser.roleTitle || 'Giáo Viên Bộ Môn',
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with avatar banner */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-extrabold text-white truncate">{currentUser.fullName}</h3>
              <div className="text-xs text-sky-200 font-mono">@{currentUser.username}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white">
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{roleInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông Tin Tài Khoản
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setPasswordMsg(null);
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Họ và tên:
                </span>
                <span className="font-bold text-slate-800">{currentUser.fullName}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email liên hệ:
                </span>
                <span className="font-semibold text-slate-800">{currentUser.email || 'Chưa cập nhật'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Số điện thoại:
                </span>
                <span className="font-semibold text-slate-800">{currentUser.phone || 'Chưa cập nhật'}</span>
              </div>

              {currentUser.assignedClass && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    Lớp chủ nhiệm:
                  </span>
                  <span className="font-bold text-teal-700">Lớp {currentUser.assignedClass}</span>
                </div>
              )}

              {currentUser.subject && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    Môn giảng dạy:
                  </span>
                  <span className="font-bold text-sky-700">{currentUser.subject}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Đăng nhập gần nhất:
                </span>
                <span className="text-slate-600 font-medium text-xs">
                  {currentUser.lastLogin
                    ? new Date(currentUser.lastLogin).toLocaleString('vi-VN')
                    : 'Lần đầu tiên'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMsg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}
                >
                  {passwordMsg.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 3 ký tự"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Khớp với mật khẩu mới"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  CẬP NHẬT MẬT KHẨU
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with logout button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
