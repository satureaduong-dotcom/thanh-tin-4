import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, UserAccount } from '../types';
import { Menu, Calendar, RotateCcw, Download, Sparkles, User, LogOut, LogIn, ChevronDown, ShieldCheck, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onResetData: () => void;
  onOpenExportModal: () => void;
  onOpenSupabaseModal?: () => void;
  onQuickAdd: (type: 'class' | 'student' | 'lesson') => void;
  currentUser: UserAccount | null;
  onOpenProfileModal: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onResetData,
  onOpenExportModal,
  onOpenSupabaseModal,
  currentUser,
  onOpenProfileModal,
  onLogout,
  onOpenAuth,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const getTabInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Trang tổng quan hệ thống',
          subtitle: 'Tổng hợp số liệu lớp học, học sinh, môn học và bài học',
        };
      case 'classes':
        return {
          title: 'Quản lý lớp học',
          subtitle: 'Danh sách các lớp từ khối 6 đến khối 9 năm học 2026-2027',
        };
      case 'students':
        return {
          title: 'Quản lý học sinh',
          subtitle: 'Tra cứu hồ sơ học sinh, thông tin phụ huynh và phân lớp',
        };
      case 'subjects_lessons':
        return {
          title: 'Quản lý môn học & bài học',
          subtitle: 'Phân phối chương trình, danh mục môn học và giáo án bài học',
        };
    }
  };

  const info = getTabInfo();
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {info.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{info.subtitle}</p>
          </div>
        </div>

        {/* Right Side: Date, Year Badge & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* School Year Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Năm học: 2026 - 2027</span>
          </div>

          {/* Date pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{dateFormatted}</span>
          </div>

          {/* Supabase Cloud Sync Modal Trigger */}
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Đồng bộ cơ sở dữ liệu Supabase"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Supabase</span>
            </button>
          )}

          {/* Export / Backup modal trigger */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Sao lưu hoặc xuất dữ liệu"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span className="hidden sm:inline">Sao lưu & Xuất</span>
          </button>

          {/* Reset data */}
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Khôi phục dữ liệu mẫu ban đầu"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Đặt lại mẫu</span>
          </button>

          {/* User Profile Pill & Dropdown / Login Button */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight truncate max-w-[130px]">
                    {currentUser.roleTitle || 'Thành viên'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">@{currentUser.username}</div>
                    <div className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      {currentUser.roleTitle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Hồ sơ & Đổi mật khẩu</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng xuất hệ thống</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-600/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
