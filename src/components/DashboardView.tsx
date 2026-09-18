import React from 'react';
import { ClassItem, StudentItem, SubjectItem, LessonItem, ActivityLog, ActiveTab } from '../types';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  PlusCircle,
  BarChart3,
  Calendar,
  Sparkles,
  School,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  subjects: SubjectItem[];
  lessons: LessonItem[];
  logs: ActivityLog[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddClass: () => void;
  onOpenAddStudent: () => void;
  onOpenAddLesson: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  subjects,
  lessons,
  logs,
  onNavigate,
  onOpenAddClass,
  onOpenAddStudent,
  onOpenAddLesson,
}) => {
  // Compute key statistics
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalSubjects = subjects.length;
  const totalLessons = lessons.length;

  // Grade distributions
  const gradeCounts = {
    6: students.filter((s) => s.grade === 6).length,
    7: students.filter((s) => s.grade === 7).length,
    8: students.filter((s) => s.grade === 8).length,
    9: students.filter((s) => s.grade === 9).length,
  };

  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;

  // Max students in any class for bar chart normalization
  const maxStudentsInClass = Math.max(...classes.map((c) => c.studentCount || 0), 1);
  const maxLessonsInSubject = Math.max(...subjects.map((s) => s.lessonCount || 0), 1);

  // Format log timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 text-white p-6 sm:p-8 shadow-lg shadow-sky-900/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Trường THCS Lê Lợi
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
            Hệ Thống Quản Lý THCS Lê Lợi
          </h1>
          <p className="text-sky-100 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
            Giải pháp trực quan giúp giáo viên chủ nhiệm và bộ môn theo dõi lớp học, học sinh, phân phối chương trình và giáo án bài học hiệu quả trong năm học 2026 - 2027.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-sky-800 hover:bg-sky-50 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              Tiếp nhận học sinh mới
            </button>
            <button
              onClick={onOpenAddClass}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-800/60 hover:bg-sky-800 text-white rounded-xl font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Thêm lớp học
            </button>
            <button
              onClick={onOpenAddLesson}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800/60 hover:bg-teal-800 text-white rounded-xl font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Soạn bài học mới
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Tổng số lớp học */}
        <div
          onClick={() => onNavigate('classes')}
          className="group p-5 sm:p-6 bg-white rounded-2xl border border-sky-100/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">Tổng số lớp học</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{totalClasses}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="font-semibold text-sky-600">Khối 6, 7, 8, 9</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-700 font-semibold group-hover:text-sky-800">
            <span>Xem quản lý lớp</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Tổng số học sinh */}
        <div
          onClick={() => onNavigate('students')}
          className="group p-5 sm:p-6 bg-white rounded-2xl border border-teal-100/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Tổng số học sinh</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{totalStudents}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <span className="text-blue-600 font-medium">Nam: {maleCount}</span>
                <span>•</span>
                <span className="text-rose-600 font-medium">Nữ: {femaleCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800">
            <span>Danh sách học sinh</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Tổng số môn học */}
        <div
          onClick={() => onNavigate('subjects_lessons')}
          className="group p-5 sm:p-6 bg-white rounded-2xl border border-indigo-100/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">Tổng số môn học</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{totalSubjects}</h3>
              <p className="text-xs text-slate-500 mt-2">Chương trình chuẩn THCS</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-semibold group-hover:text-indigo-800">
            <span>Xem danh mục môn</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Tổng số bài học */}
        <div
          onClick={() => onNavigate('subjects_lessons')}
          className="group p-5 sm:p-6 bg-white rounded-2xl border border-amber-100/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Tổng số bài học</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{totalLessons}</h3>
              <p className="text-xs text-slate-500 mt-2">Giáo án các khối 6-9</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold group-hover:text-amber-800">
            <span>Xem phân phối bài học</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Số học sinh theo từng lớp */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                Sĩ số học sinh theo từng lớp học
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Thống kê số lượng học sinh thực tế đang được phân bổ</p>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
            >
              Chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {classes.map((cls) => {
              const count = cls.studentCount || 0;
              const percentage = Math.round((count / (maxStudentsInClass || 1)) * 100);
              return (
                <div key={cls.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{cls.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                        Khối {cls.grade}
                      </span>
                      <span className="text-slate-400 hidden sm:inline">• GVCN: {cls.teacher}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{count} học sinh</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grade distribution summary chips */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[6, 7, 8, 9].map((g) => (
              <div key={g} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs font-medium text-slate-500">Khối {g}</div>
                <div className="text-lg font-bold text-slate-900">
                  {gradeCounts[g as keyof typeof gradeCounts]} <span className="text-xs font-normal text-slate-400">HS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Số bài học theo môn học */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Bài học theo môn
              </h3>
              <button
                onClick={() => onNavigate('subjects_lessons')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
              >
                Tất cả
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Số lượng bài giảng đã biên soạn theo từng môn</p>

            <div className="space-y-3">
              {subjects.map((sub) => {
                const count = sub.lessonCount || 0;
                const percentage = Math.round((count / (maxLessonsInSubject || 1)) * 100);
                return (
                  <div key={sub.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">{sub.name}</span>
                      <span className="font-bold text-slate-700">{count} bài</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(percentage, 10)}%`,
                          backgroundColor: sub.color || '#0284c7',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Đồng bộ tự động: </span>
              Giáo án và sĩ số luôn tự động tính toán từ danh sách thực tế.
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: RECENT CLASSES & RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes List */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-sky-600" />
              Danh sách lớp học gần đây
            </h3>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
            >
              Xem tất cả ({classes.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {classes.slice(0, 4).map((cls) => (
              <div key={cls.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 font-extrabold flex items-center justify-center text-sm border border-sky-100">
                    {cls.name}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Lớp {cls.name}</div>
                    <div className="text-xs text-slate-500">GVCN: {cls.teacher}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                    {cls.studentCount || 0} học sinh
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">Khối {cls.grade} • {cls.schoolYear}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Hoạt động gần đây
            </h3>
            <span className="text-xs font-medium text-slate-400">Thời gian thực</span>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => {
              let badgeColor = 'bg-sky-100 text-sky-800';
              if (log.type === 'student') badgeColor = 'bg-teal-100 text-teal-800';
              if (log.type === 'lesson') badgeColor = 'bg-amber-100 text-amber-800';
              if (log.type === 'system') badgeColor = 'bg-slate-100 text-slate-800';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeColor}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-snug">{log.targetName}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0 font-medium">
                    {formatTime(log.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
