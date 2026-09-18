import React from 'react';
import { ActiveTab, UserAccount } from '../types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  School,
  Sparkles,
  LogOut,
  User,
  LogIn,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  counts: {
    classes: number;
    students: number;
    subjects: number;
    lessons: number;
  };
  currentUser: UserAccount | null;
  onOpenProfileModal: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  counts,
  currentUser,
  onOpenProfileModal,
  onLogout,
  onOpenAuth,
}) => {
  const menuItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    description: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Trang tổng quan',
      icon: LayoutDashboard,
      description: 'Thống kê & hoạt động',
    },
    {
      id: 'classes',
      label: 'Quản lý lớp học',
      icon: Users,
      count: counts.classes,
      description: 'Danh sách, khối & GVCN',
    },
    {
      id: 'students',
      label: 'Quản lý học sinh',
      icon: GraduationCap,
      count: counts.students,
      description: 'Hồ sơ & liên lạc phụ huynh',
    },
    {
      id: 'subjects_lessons',
      label: 'Quản lý môn học & bài học',
      icon: BookOpen,
      count: counts.subjects,
      description: 'Chương trình & bài học',
    },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-xs ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* App Branding */}
        <div className="h-20 flex items-center px-4 border-b border-slate-100 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <School className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight line-clamp-1" title="Trường THCS Lê Lợi">
                  THCS LÊ LỢI
                </h1>
                <p className="text-xs text-teal-700 font-medium tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Giáo dục 2026-2027</span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Card */}
        {!isCollapsed ? (
          <div className="mx-4 my-3 p-3 bg-gradient-to-r from-sky-50 to-teal-50 rounded-xl border border-sky-100/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                GV
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">Cổng Giáo Viên THCS</div>
                <div className="text-[11px] text-slate-500 truncate">Chủ nhiệm & Bộ môn</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
              GV
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1">
            {!isCollapsed ? 'Menu chức năng chính' : 'Menu'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-sky-600'
                  }`}
                />

                {!isCollapsed && (
                  <div className="min-w-0 flex-1 flex items-center justify-between">
                    <div className="truncate">
                      <div className="text-sm tracking-tight">{item.label}</div>
                      <div
                        className={`text-[11px] truncate font-normal ${
                          isActive ? 'text-sky-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-800'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info & User account in sidebar */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/90">
          {currentUser ? (
            <div>
              {!isCollapsed ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                    title="Xem hồ sơ & đổi mật khẩu"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-700">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {currentUser.roleTitle}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="w-full flex justify-center py-1.5 cursor-pointer"
                  title={`${currentUser.fullName} (${currentUser.roleTitle})`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-transform">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-2 px-3 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full flex justify-center py-1.5 text-sky-600 hover:text-sky-700 cursor-pointer"
                  title="Đăng nhập tài khoản"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {!isCollapsed && (
            <div className="text-center mt-2">
              <div className="text-[11px] font-medium text-slate-400">Trường THCS Lê Lợi • 2026-2027</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
