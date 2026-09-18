/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  SubjectLessonSubTab,
  ClassItem,
  StudentItem,
  SubjectItem,
  LessonItem,
  ActivityLog,
  ToastMessage,
  UserAccount,
} from './types';
import {
  getClasses,
  saveClasses,
  getStudents,
  saveStudents,
  getSubjects,
  saveSubjects,
  getLessons,
  saveLessons,
  getLogs,
  addLog,
  resetAllDataToDefault,
} from './utils/storage';
import { getCurrentUser, setCurrentUser as persistCurrentUser } from './utils/auth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ClassManagement } from './components/ClassManagement';
import { StudentManagement } from './components/StudentManagement';
import { SubjectLessonManagement } from './components/SubjectLessonManagement';
import { ToastContainer } from './components/ToastContainer';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { AuthPage } from './components/AuthPage';
import { UserProfileModal } from './components/UserProfileModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import {
  pullAllDataFromSupabase,
  syncClassToSupabase,
  syncStudentToSupabase,
  syncSubjectToSupabase,
  syncLessonToSupabase,
} from './utils/supabaseSync';

export default function App() {
  // State for Entities
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [subjectSubTab, setSubjectSubTab] = useState<SubjectLessonSubTab>('subjects');

  // Sidebar Layout State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Cross-Navigation Interactivity State
  const [preSelectedStudent, setPreSelectedStudent] = useState<StudentItem | null>(null);
  const [preSelectedClassIdForAdd, setPreSelectedClassIdForAdd] = useState<string | null>(null);
  const [openAddLessonDirectly, setOpenAddLessonDirectly] = useState(false);

  // Modals & Feedback
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Authentication State
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => getCurrentUser());
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Initial Load from LocalStorage
  const loadData = () => {
    setClasses(getClasses());
    setStudents(getStudents());
    setSubjects(getSubjects());
    setLessons(getLessons());
    setLogs(getLogs());
  };

  useEffect(() => {
    loadData();

    // Check & pull latest cloud data if Supabase is connected
    const initializeSupabaseSync = async () => {
      try {
        const pullRes = await pullAllDataFromSupabase();
        if (pullRes.success && pullRes.hasData) {
          loadData();
          showToast('Đã tự động đồng bộ dữ liệu mới nhất từ Supabase Cloud!', 'info');
        }
      } catch (err) {
        console.debug('Background Supabase pull note:', err);
      }
    };
    initializeSupabaseSync();
  }, []);

  // Toast Notification Helper
  const showToast = (message: string, type: ToastMessage['type'] = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean) => {
    persistCurrentUser(user, rememberMe);
    setCurrentUserState(user);
    setShowAuthPage(false);
    setIsGuestMode(false);
    showToast(
      `Xin chào ${user.fullName} (${user.roleTitle})! Chúc thầy/cô công tác tốt.`,
      'success',
      'Đăng nhập thành công'
    );
    addLog('Đăng nhập hệ thống', `Người dùng ${user.fullName} (${user.username}) đăng nhập`, 'system');
    setLogs(getLogs());
  };

  const handleLogout = () => {
    persistCurrentUser(null);
    setCurrentUserState(null);
    setIsProfileModalOpen(false);
    setIsGuestMode(false);
    setShowAuthPage(true);
    showToast('Đã đăng xuất tài khoản an toàn.', 'info');
    addLog('Đăng xuất hệ thống', 'Người dùng đã đăng xuất tài khoản', 'system');
    setLogs(getLogs());
  };

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    setShowAuthPage(false);
    showToast('Đang ở chế độ xem thử với tư cách Khách.', 'info');
  };

  // --------------------------------------------------------------------------
  // CLASS HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveClass = (classData: Omit<ClassItem, 'createdAt' | 'id'> & { id?: string }) => {
    if (classData.id) {
      // Edit
      const updated = classes.map((c) =>
        c.id === classData.id
          ? {
              ...c,
              code: classData.code,
              name: classData.name,
              grade: classData.grade,
              schoolYear: classData.schoolYear,
              teacher: classData.teacher,
              note: classData.note,
            }
          : c
      );
      saveClasses(updated);
      const savedItem = updated.find((c) => c.id === classData.id);
      if (savedItem) syncClassToSupabase(savedItem);

      // Also sync student records with new class name/grade
      const updatedStudents = students.map((s) => {
        if (s.classId === classData.id) {
          return { ...s, className: classData.name, grade: classData.grade };
        }
        return s;
      });
      saveStudents(updatedStudents);

      addLog('Cập nhật lớp học', `Lớp ${classData.name} (${classData.code})`, 'class');
      showToast(`Đã cập nhật thông tin lớp ${classData.name} thành công!`, 'success');
    } else {
      // Create
      const newClass: ClassItem = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        code: classData.code,
        name: classData.name,
        grade: classData.grade,
        schoolYear: classData.schoolYear,
        teacher: classData.teacher,
        note: classData.note,
        createdAt: new Date().toISOString(),
      };
      const updated = [...classes, newClass];
      saveClasses(updated);
      syncClassToSupabase(newClass);
      addLog('Thêm lớp học mới', `Lớp ${classData.name} - Khối ${classData.grade}`, 'class');
      showToast(`Đã tạo lớp ${classData.name} thành công!`, 'success');
    }

    loadData();
    return { success: true, message: 'Thành công' };
  };

  const handleDeleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);
    const updated = classes.filter((c) => c.id !== id);
    saveClasses(updated);
    if (target) syncClassToSupabase(target, true);

    if (target) {
      addLog('Xóa lớp học', `Đã xóa lớp ${target.name} (${target.code})`, 'class');
      showToast(`Đã xóa lớp học ${target.name} thành công!`, 'info');
    }

    loadData();
    return { success: true, message: 'Đã xóa' };
  };

  // --------------------------------------------------------------------------
  // STUDENT HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveStudent = (studentData: Omit<StudentItem, 'createdAt' | 'id'> & { id?: string }) => {
    if (studentData.id) {
      // Edit
      const updated = students.map((s) =>
        s.id === studentData.id
          ? {
              ...s,
              ...studentData,
            }
          : s
      );
      saveStudents(updated);
      const savedStudent = updated.find((s) => s.id === studentData.id);
      if (savedStudent) syncStudentToSupabase(savedStudent);
      addLog('Cập nhật hồ sơ', `${studentData.fullName} (${studentData.code})`, 'student');
      showToast(`Đã cập nhật hồ sơ học sinh ${studentData.fullName}!`, 'success');
    } else {
      // Create
      const newStudent: StudentItem = {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        ...studentData,
        createdAt: new Date().toISOString(),
      };
      const updated = [...students, newStudent];
      saveStudents(updated);
      syncStudentToSupabase(newStudent);
      addLog('Tiếp nhận học sinh', `${studentData.fullName} vào lớp ${studentData.className || ''}`, 'student');
      showToast(`Đã tiếp nhận hồ sơ học sinh ${studentData.fullName} thành công!`, 'success');
    }

    loadData();
    return { success: true, message: 'Thành công' };
  };

  const handleImportStudents = (
    newStudentsList: (Omit<StudentItem, 'createdAt' | 'id'> & { id?: string })[]
  ) => {
    let addedCount = 0;
    let updatedCount = 0;

    let updatedList = [...students];

    newStudentsList.forEach((item) => {
      const existingIdx = updatedList.findIndex(
        (s) => (item.id && s.id === item.id) || s.code.toUpperCase() === item.code.toUpperCase()
      );

      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          ...item,
        };
        syncStudentToSupabase(updatedList[existingIdx]);
        updatedCount++;
      } else {
        const newStu: StudentItem = {
          id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          ...item,
          createdAt: new Date().toISOString(),
        };
        updatedList.push(newStu);
        syncStudentToSupabase(newStu);
        addedCount++;
      }
    });

    saveStudents(updatedList);
    addLog(
      'Nhập Excel học sinh',
      `Đã nhập ${addedCount} học sinh mới và cập nhật ${updatedCount} hồ sơ`,
      'student'
    );
    showToast(
      `Đã nhập thành công ${addedCount} học sinh mới và cập nhật ${updatedCount} hồ sơ!`,
      'success',
      'Nhập Excel thành công'
    );
    loadData();
    return { success: true, addedCount, updatedCount };
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    const updated = students.filter((s) => s.id !== id);
    saveStudents(updated);
    if (target) syncStudentToSupabase(target, true);

    if (target) {
      addLog('Xóa học sinh', `Đã xóa hồ sơ ${target.fullName} (${target.code})`, 'student');
      showToast(`Đã xóa hồ sơ học sinh ${target.fullName} khỏi hệ thống!`, 'info');
    }

    loadData();
    return { success: true, message: 'Đã xóa' };
  };

  const handleDeleteMultipleStudents = (ids: string[]) => {
    if (!ids || ids.length === 0) return { success: false, count: 0 };
    const idSet = new Set(ids);
    const updated = students.filter((s) => !idSet.has(s.id));
    const deletedCount = students.length - updated.length;
    saveStudents(updated);

    addLog(
      'Xóa nhiều học sinh',
      `Đã xóa hàng loạt ${deletedCount} hồ sơ học sinh`,
      'student'
    );
    showToast(`Đã xóa thành công ${deletedCount} học sinh khỏi hệ thống!`, 'info', 'Đã xóa hàng loạt');
    loadData();
    return { success: true, count: deletedCount };
  };

  const handleDeleteAllStudents = (filterParams?: { classId?: string; grade?: string }) => {
    let updated: StudentItem[] = [];
    let deletedCount = 0;

    if (filterParams?.classId && filterParams.classId !== 'all') {
      const cls = classes.find((c) => c.id === filterParams.classId);
      const clsName = cls?.name || filterParams.classId;
      updated = students.filter((s) => s.classId !== filterParams.classId && s.className !== clsName);
      deletedCount = students.length - updated.length;
      addLog('Xóa học sinh theo lớp', `Đã xóa toàn bộ ${deletedCount} học sinh của lớp ${clsName}`, 'student');
    } else if (filterParams?.grade && filterParams.grade !== 'all') {
      const gradeNum = parseInt(filterParams.grade, 10);
      updated = students.filter((s) => s.grade !== gradeNum);
      deletedCount = students.length - updated.length;
      addLog('Xóa học sinh theo khối', `Đã xóa toàn bộ ${deletedCount} học sinh thuộc Khối ${filterParams.grade}`, 'student');
    } else {
      deletedCount = students.length;
      updated = [];
      addLog('Xóa tất cả học sinh', `Đã xóa toàn bộ ${deletedCount} học sinh trong hệ thống`, 'student');
    }

    saveStudents(updated);
    showToast(
      `Đã xóa thành công ${deletedCount} hồ sơ học sinh!`,
      'info',
      'Đã xóa dữ liệu'
    );
    loadData();
    return { success: true, count: deletedCount };
  };

  // --------------------------------------------------------------------------
  // SUBJECT HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveSubject = (subjectData: Omit<SubjectItem, 'createdAt' | 'id'> & { id?: string }) => {
    if (subjectData.id) {
      const updated = subjects.map((s) =>
        s.id === subjectData.id
          ? {
              ...s,
              ...subjectData,
            }
          : s
      );
      saveSubjects(updated);
      const savedSub = updated.find((s) => s.id === subjectData.id);
      if (savedSub) syncSubjectToSupabase(savedSub);

      // Sync lessons if subject name changes
      const updatedLessons = lessons.map((l) => {
        if (l.subjectId === subjectData.id) {
          return { ...l, subjectName: subjectData.name };
        }
        return l;
      });
      saveLessons(updatedLessons);

      addLog('Cập nhật môn học', `Môn ${subjectData.name} (${subjectData.code})`, 'subject');
      showToast(`Đã cập nhật môn ${subjectData.name} thành công!`, 'success');
    } else {
      const newSubject: SubjectItem = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        ...subjectData,
        createdAt: new Date().toISOString(),
      };
      const updated = [...subjects, newSubject];
      saveSubjects(updated);
      syncSubjectToSupabase(newSubject);
      addLog('Thêm môn học mới', `Môn ${subjectData.name}`, 'subject');
      showToast(`Đã thêm môn học ${subjectData.name} vào chương trình!`, 'success');
    }

    loadData();
    return { success: true, message: 'Thành công' };
  };

  const handleDeleteSubject = (id: string) => {
    const target = subjects.find((s) => s.id === id);
    const updated = subjects.filter((s) => s.id !== id);
    saveSubjects(updated);
    if (target) syncSubjectToSupabase(target, true);

    if (target) {
      addLog('Xóa môn học', `Đã xóa môn ${target.name} (${target.code})`, 'subject');
      showToast(`Đã xóa môn học ${target.name}!`, 'info');
    }

    loadData();
    return { success: true, message: 'Đã xóa' };
  };

  // --------------------------------------------------------------------------
  // LESSON HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveLesson = (lessonData: Omit<LessonItem, 'createdAt' | 'id'> & { id?: string }) => {
    if (lessonData.id) {
      const updated = lessons.map((l) =>
        l.id === lessonData.id
          ? {
              ...l,
              ...lessonData,
            }
          : l
      );
      saveLessons(updated);
      const savedLesson = updated.find((l) => l.id === lessonData.id);
      if (savedLesson) syncLessonToSupabase(savedLesson);
      addLog('Cập nhật bài học', `Bài ${lessonData.title} (${lessonData.code})`, 'lesson');
      showToast(`Đã cập nhật bài học ${lessonData.title}!`, 'success');
    } else {
      const newLesson: LessonItem = {
        id: 'l_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        ...lessonData,
        createdAt: new Date().toISOString(),
      };
      const updated = [...lessons, newLesson];
      saveLessons(updated);
      syncLessonToSupabase(newLesson);
      addLog('Soạn bài học mới', `Bài ${lessonData.title} - ${lessonData.subjectName}`, 'lesson');
      showToast(`Đã thêm bài học "${lessonData.title}" vào giáo án!`, 'success');
    }

    loadData();
    return { success: true, message: 'Thành công' };
  };

  const handleDeleteLesson = (id: string) => {
    const target = lessons.find((l) => l.id === id);
    const updated = lessons.filter((l) => l.id !== id);
    saveLessons(updated);
    if (target) syncLessonToSupabase(target, true);

    if (target) {
      addLog('Xóa bài học', `Đã xóa bài học ${target.title} (${target.code})`, 'lesson');
      showToast(`Đã xóa bài học "${target.title}"!`, 'info');
    }

    loadData();
    return { success: true, message: 'Đã xóa' };
  };

  // --------------------------------------------------------------------------
  // RESET DATA
  // --------------------------------------------------------------------------
  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về trạng thái mẫu ban đầu?')) {
      resetAllDataToDefault();
      loadData();
      showToast('Đã khôi phục toàn bộ dữ liệu mẫu THCS thành công!', 'success');
    }
  };

  // Quick action jumps
  const handleAddStudentToClass = (classId: string) => {
    setPreSelectedClassIdForAdd(classId);
    setActiveTab('students');
  };

  const handleViewStudentProfile = (student: StudentItem) => {
    setPreSelectedStudent(student);
    setActiveTab('students');
  };

  // If user is not logged in and not in guest mode, or specifically opened auth page
  if ((!currentUser && !isGuestMode) || showAuthPage) {
    return (
      <div className="min-h-screen bg-slate-900">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onContinueAsGuest={handleContinueAsGuest}
          classes={classes}
          subjects={subjects}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Sidebar (Fixed 4 Main Tabs) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        counts={{
          classes: classes.length,
          students: students.length,
          subjects: subjects.length,
          lessons: lessons.length,
        }}
        currentUser={currentUser}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthPage(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onResetData={handleResetData}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          currentUser={currentUser}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthPage(true)}
          onQuickAdd={(type) => {
            if (type === 'class') setActiveTab('classes');
            if (type === 'student') setActiveTab('students');
            if (type === 'lesson') {
              setActiveTab('subjects_lessons');
              setSubjectSubTab('lessons');
              setOpenAddLessonDirectly(true);
            }
          }}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              classes={classes}
              students={students}
              subjects={subjects}
              lessons={lessons}
              logs={logs}
              onNavigate={setActiveTab}
              onOpenAddClass={() => setActiveTab('classes')}
              onOpenAddStudent={() => setActiveTab('students')}
              onOpenAddLesson={() => {
                setActiveTab('subjects_lessons');
                setSubjectSubTab('lessons');
                setOpenAddLessonDirectly(true);
              }}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManagement
              classes={classes}
              students={students}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onViewStudent={handleViewStudentProfile}
              onAddStudentToClass={handleAddStudentToClass}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              students={students}
              classes={classes}
              preSelectedStudent={preSelectedStudent}
              onClearPreSelectedStudent={() => setPreSelectedStudent(null)}
              preSelectedClassIdForAdd={preSelectedClassIdForAdd}
              onClearPreSelectedClassId={() => setPreSelectedClassIdForAdd(null)}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteMultipleStudents={handleDeleteMultipleStudents}
              onDeleteAllStudents={handleDeleteAllStudents}
              onImportStudents={handleImportStudents}
            />
          )}

          {activeTab === 'subjects_lessons' && (
            <SubjectLessonManagement
              subjects={subjects}
              lessons={lessons}
              activeSubTab={subjectSubTab}
              setActiveSubTab={setSubjectSubTab}
              onSaveSubject={handleSaveSubject}
              onDeleteSubject={handleDeleteSubject}
              onSaveLesson={handleSaveLesson}
              onDeleteLesson={handleDeleteLesson}
              openAddLessonDirectly={openAddLessonDirectly}
              onClearOpenAddLessonDirectly={() => setOpenAddLessonDirectly(false)}
            />
          )}
        </main>
      </div>

      {/* Standalone Export & Backup Modal */}
      <StandaloneExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classes={classes}
        students={students}
        subjects={subjects}
        lessons={lessons}
        logs={logs}
        onDataImported={loadData}
        onShowToast={showToast}
      />

      {/* User Profile Modal */}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Supabase Database Connection Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefreshData={loadData}
        onShowToast={showToast}
      />
    </div>
  );
}
