import React, { useState, useMemo } from 'react';
import { SubjectItem, LessonItem, GradeLevel, SubjectLessonSubTab } from '../types';
import {
  BookOpen,
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Layers,
  X,
  Check,
  AlertCircle,
  Hash,
  Sparkles,
  ArrowRight,
  BookMarked,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SubjectLessonManagementProps {
  subjects: SubjectItem[];
  lessons: LessonItem[];
  activeSubTab: SubjectLessonSubTab;
  setActiveSubTab: (tab: SubjectLessonSubTab) => void;
  onSaveSubject: (subjectData: Omit<SubjectItem, 'createdAt' | 'id'> & { id?: string }) => { success: boolean; message: string };
  onDeleteSubject: (id: string) => { success: boolean; message: string };
  onSaveLesson: (lessonData: Omit<LessonItem, 'createdAt' | 'id'> & { id?: string }) => { success: boolean; message: string };
  onDeleteLesson: (id: string) => { success: boolean; message: string };
  openAddLessonDirectly?: boolean;
  onClearOpenAddLessonDirectly?: () => void;
}

export const SubjectLessonManagement: React.FC<SubjectLessonManagementProps> = ({
  subjects,
  lessons,
  activeSubTab,
  setActiveSubTab,
  onSaveSubject,
  onDeleteSubject,
  onSaveLesson,
  onDeleteLesson,
  openAddLessonDirectly,
  onClearOpenAddLessonDirectly,
}) => {
  // -------------------------------------------------------------
  // TAB 1: SUBJECTS STATE & LOGIC
  // -------------------------------------------------------------
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);

  const [subjectFormData, setSubjectFormData] = useState<{
    code: string;
    name: string;
    grades: GradeLevel[];
    description: string;
    color: string;
  }>({
    code: '',
    name: '',
    grades: [6, 7, 8, 9],
    description: '',
    color: '#0284c7',
  });

  const [subjectFormErrors, setSubjectFormErrors] = useState<Record<string, string>>({});

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      return (
        s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(subjectSearch.toLowerCase()))
      );
    });
  }, [subjects, subjectSearch]);

  const handleOpenAddSubject = () => {
    const currentCodes = subjects.map((s) => parseInt(s.code.replace(/\D/g, '') || '0'));
    const nextNum = Math.max(0, ...currentCodes) + 1;
    const autoCode = `MH${nextNum.toString().padStart(3, '0')}`;

    setEditingSubject(null);
    setSubjectFormData({
      code: autoCode,
      name: '',
      grades: [6, 7, 8, 9],
      description: '',
      color: '#0284c7',
    });
    setSubjectFormErrors({});
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectFormData({
      code: sub.code,
      name: sub.name,
      grades: sub.grades,
      description: sub.description || '',
      color: sub.color || '#0284c7',
    });
    setSubjectFormErrors({});
    setIsSubjectModalOpen(true);
  };

  const handleToggleGradeInSubject = (grade: GradeLevel) => {
    setSubjectFormData((prev) => {
      if (prev.grades.includes(grade)) {
        if (prev.grades.length === 1) return prev; // Keep at least one
        return { ...prev, grades: prev.grades.filter((g) => g !== grade) };
      } else {
        return { ...prev, grades: [...prev.grades, grade].sort() };
      }
    });
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!subjectFormData.code.trim()) {
      errors.code = 'Mã môn học không được để trống';
    } else {
      const duplicate = subjects.find(
        (s) =>
          s.code.toLowerCase() === subjectFormData.code.trim().toLowerCase() &&
          (!editingSubject || s.id !== editingSubject.id)
      );
      if (duplicate) {
        errors.code = `Mã môn "${subjectFormData.code}" đã được dùng cho môn ${duplicate.name}`;
      }
    }

    if (!subjectFormData.name.trim()) {
      errors.name = 'Vui lòng nhập tên môn học (ví dụ: Toán, Ngữ văn...)';
    }

    if (subjectFormData.grades.length === 0) {
      errors.grades = 'Phải chọn ít nhất 1 khối áp dụng';
    }

    setSubjectFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = onSaveSubject({
      id: editingSubject?.id,
      code: subjectFormData.code.trim().toUpperCase(),
      name: subjectFormData.name.trim(),
      grades: subjectFormData.grades,
      description: subjectFormData.description.trim(),
      color: subjectFormData.color,
    });

    if (result.success) {
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: LESSONS STATE & LOGIC
  // -------------------------------------------------------------
  const [lessonSearch, setLessonSearch] = useState('');
  const [selectedLessonSubjectId, setSelectedLessonSubjectId] = useState<string>('all');
  const [selectedLessonGrade, setSelectedLessonGrade] = useState<string>('all');

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [viewingLesson, setViewingLesson] = useState<LessonItem | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<LessonItem | null>(null);

  const [lessonFormData, setLessonFormData] = useState<{
    code: string;
    title: string;
    subjectId: string;
    grade: GradeLevel;
    chapter: string;
    order: number;
    shortDescription: string;
    note: string;
  }>({
    code: '',
    title: '',
    subjectId: subjects[0]?.id || '',
    grade: 6,
    chapter: 'Chương 1',
    order: 1,
    shortDescription: '',
    note: '',
  });

  const [lessonFormErrors, setLessonFormErrors] = useState<Record<string, string>>({});

  // Direct trigger for Add Lesson if requested from outside
  React.useEffect(() => {
    if (openAddLessonDirectly) {
      setActiveSubTab('lessons');
      handleOpenAddLesson();
      onClearOpenAddLessonDirectly?.();
    }
  }, [openAddLessonDirectly, onClearOpenAddLessonDirectly]);

  const handleOpenAddLesson = (preSubjectId?: string) => {
    const currentCodes = lessons.map((l) => parseInt(l.code.replace(/\D/g, '') || '0'));
    const nextNum = Math.max(0, ...currentCodes) + 1;
    const autoCode = `BH${nextNum.toString().padStart(3, '0')}`;

    const targetSub = preSubjectId || (selectedLessonSubjectId !== 'all' ? selectedLessonSubjectId : subjects[0]?.id) || '';

    setEditingLesson(null);
    setLessonFormData({
      code: autoCode,
      title: '',
      subjectId: targetSub,
      grade: 6,
      chapter: 'Chương 1',
      order: 1,
      shortDescription: '',
      note: '',
    });
    setLessonFormErrors({});
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setLessonFormData({
      code: lesson.code,
      title: lesson.title,
      subjectId: lesson.subjectId,
      grade: lesson.grade,
      chapter: lesson.chapter,
      order: lesson.order,
      shortDescription: lesson.shortDescription || '',
      note: lesson.note || '',
    });
    setLessonFormErrors({});
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!lessonFormData.code.trim()) {
      errors.code = 'Mã bài học không được để trống';
    } else {
      const duplicate = lessons.find(
        (l) =>
          l.code.toLowerCase() === lessonFormData.code.trim().toLowerCase() &&
          (!editingLesson || l.id !== editingLesson.id)
      );
      if (duplicate) {
        errors.code = `Mã bài "${lessonFormData.code}" đã thuộc về bài học "${duplicate.title}"`;
      }
    }

    if (!lessonFormData.title.trim()) {
      errors.title = 'Vui lòng nhập tên bài học';
    }

    if (!lessonFormData.subjectId) {
      errors.subjectId = 'Vui lòng chọn môn học';
    }

    if (!lessonFormData.chapter.trim()) {
      errors.chapter = 'Vui lòng nhập tên chương hoặc Unit';
    }

    if (!lessonFormData.order || lessonFormData.order < 1) {
      errors.order = 'Thứ tự bài phải lớn hơn hoặc bằng 1';
    }

    setLessonFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const matchedSubject = subjects.find((s) => s.id === lessonFormData.subjectId);

    const result = onSaveLesson({
      id: editingLesson?.id,
      code: lessonFormData.code.trim().toUpperCase(),
      title: lessonFormData.title.trim(),
      subjectId: lessonFormData.subjectId,
      subjectName: matchedSubject?.name || 'Môn học',
      grade: lessonFormData.grade,
      chapter: lessonFormData.chapter.trim(),
      order: Number(lessonFormData.order),
      shortDescription: lessonFormData.shortDescription.trim() || undefined,
      note: lessonFormData.note.trim() || undefined,
    });

    if (result.success) {
      setIsLessonModalOpen(false);
      setEditingLesson(null);
    }
  };

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(lessonSearch.toLowerCase()) ||
        (l.chapter && l.chapter.toLowerCase().includes(lessonSearch.toLowerCase())) ||
        (l.shortDescription && l.shortDescription.toLowerCase().includes(lessonSearch.toLowerCase()));

      const matchSubject =
        selectedLessonSubjectId === 'all' || l.subjectId === selectedLessonSubjectId;

      const matchGrade =
        selectedLessonGrade === 'all' || l.grade.toString() === selectedLessonGrade;

      return matchSearch && matchSubject && matchGrade;
    });
  }, [lessons, lessonSearch, selectedLessonSubjectId, selectedLessonGrade]);

  // Jump from subject card to lessons filtered for that subject
  const handleViewSubjectLessons = (subject: SubjectItem) => {
    setSelectedLessonSubjectId(subject.id);
    setSelectedLessonGrade('all');
    setLessonSearch('');
    setActiveSubTab('lessons');
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('subjects')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'subjects'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            TAB 1: MÔN HỌC ({subjects.length})
          </button>

          <button
            onClick={() => setActiveSubTab('lessons')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'lessons'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            TAB 2: BÀI HỌC ({lessons.length})
          </button>
        </div>

        <div>
          {activeSubTab === 'subjects' ? (
            <button
              onClick={handleOpenAddSubject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm môn học
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddLesson()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Soạn bài học mới
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW FOR TAB 1: MÔN HỌC */}
      {/* ========================================================================= */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Tìm môn học theo tên, mã môn..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
              />
              {subjectSearch && (
                <button
                  onClick={() => setSubjectSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500">
              Hiển thị <strong className="text-slate-800">{filteredSubjects.length}</strong> môn học
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top line with code and actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSubject(sub)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa môn học"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSubjectToDelete(sub)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa môn học"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subject Name */}
                  <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors mb-2">
                    {sub.name}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {sub.description || 'Chưa có mô tả chi tiết cho môn học này.'}
                  </p>

                  {/* Applicable grades pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {sub.grades.map((g) => (
                      <span
                        key={g}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        Khối {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom line: Lesson count & Jump button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                    {sub.lessonCount || 0} bài học
                  </span>
                  <button
                    onClick={() => handleViewSubjectLessons(sub)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    Xem bài học <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW FOR TAB 2: BÀI HỌC */}
      {/* ========================================================================= */}
      {activeSubTab === 'lessons' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Search and Filters for Lessons */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  placeholder="Tìm bài học theo tên, chương, nội dung..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                />
                {lessonSearch && (
                  <button
                    onClick={() => setLessonSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters: Subject & Grade */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {/* Lọc môn học */}
                <select
                  value={selectedLessonSubjectId}
                  onChange={(e) => setSelectedLessonSubjectId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700"
                >
                  <option value="all">Tất cả môn học</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>

                {/* Lọc Khối */}
                <select
                  value={selectedLessonGrade}
                  onChange={(e) => setSelectedLessonGrade(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700"
                >
                  <option value="all">Tất cả khối</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lessons Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredLessons.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy bài học nào</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                  Không có bài học nào khớp với điều kiện tìm kiếm hoặc môn học được chọn.
                </p>
                <button
                  onClick={() => handleOpenAddLesson()}
                  className="px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  Soạn bài học mới ngay
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Mã bài</th>
                      <th className="px-5 py-4">Tên bài học</th>
                      <th className="px-5 py-4">Môn học</th>
                      <th className="px-5 py-4">Khối</th>
                      <th className="px-5 py-4">Chương / Unit</th>
                      <th className="px-5 py-4 text-center">Thứ tự</th>
                      <th className="px-5 py-4">Mô tả ngắn</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLessons.map((lesson) => (
                      <tr
                        key={lesson.id}
                        className="hover:bg-teal-50/30 transition-colors group"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-teal-700">
                          {lesson.code}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 text-base max-w-xs">
                          {lesson.title}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-bold text-xs border border-sky-100">
                            <BookOpen className="w-3 h-3 text-sky-600" />
                            {lesson.subjectName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Khối {lesson.grade}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {lesson.chapter}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-800">
                          #{lesson.order}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                          {lesson.shortDescription || <span className="text-slate-300 italic">Không có mô tả</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingLesson(lesson)}
                              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết giáo án bài học"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa bài học"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setLessonToDelete(lesson)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bài học"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA MÔN HỌC */}
      {/* ========================================================================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                {editingSubject ? `Sửa Môn: ${editingSubject.name}` : 'Thêm Môn Học Mới'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              {/* Mã môn & Tên môn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subjectFormData.code}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                  placeholder="VD: MH001"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    subjectFormErrors.code ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                />
                {subjectFormErrors.code && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {subjectFormErrors.code}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  placeholder="VD: Toán học, Ngữ văn, Lịch sử..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    subjectFormErrors.name ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                />
                {subjectFormErrors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {subjectFormErrors.name}
                  </p>
                )}
              </div>

              {/* Khối áp dụng Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khối áp dụng <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([6, 7, 8, 9] as GradeLevel[]).map((g) => {
                    const isChecked = subjectFormData.grades.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => handleToggleGradeInSubject(g)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    );
                  })}
                </div>
                {subjectFormErrors.grades && (
                  <p className="text-xs text-rose-600 mt-1">{subjectFormErrors.grades}</p>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả môn học</label>
                <textarea
                  rows={2}
                  value={subjectFormData.description}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                  placeholder="Mục tiêu, phân môn, định hướng bài học..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingSubject ? 'Cập nhật môn' : 'Lưu môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA BÀI HỌC */}
      {/* ========================================================================= */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                {editingLesson ? `Sửa Bài Học: ${editingLesson.title}` : 'Biên Soạn Bài Học Mới'}
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              {/* Row 1: Mã bài & Tên bài */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã bài <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lessonFormData.code}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, code: e.target.value })}
                    placeholder="VD: BH001"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      lessonFormErrors.code ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {lessonFormErrors.code && (
                    <p className="text-xs text-rose-600 mt-1">{lessonFormErrors.code}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lessonFormData.title}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                    placeholder="VD: Số tự nhiên và phép tính"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      lessonFormErrors.title ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {lessonFormErrors.title && (
                    <p className="text-xs text-rose-600 mt-1">{lessonFormErrors.title}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Môn học & Khối */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Môn học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={lessonFormData.subjectId}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Khối học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={lessonFormData.grade}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, grade: parseInt(e.target.value) as GradeLevel })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Chương & Thứ tự */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chương / Chuyên đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lessonFormData.chapter}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, chapter: e.target.value })}
                    placeholder="VD: Chương 1: Số tự nhiên hoặc Unit 1"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {lessonFormErrors.chapter && (
                    <p className="text-xs text-rose-600 mt-1">{lessonFormErrors.chapter}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thứ tự bài <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonFormData.order}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, order: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả tóm tắt nội dung</label>
                <textarea
                  rows={2}
                  value={lessonFormData.shortDescription}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, shortDescription: e.target.value })}
                  placeholder="Kiến thức trọng tâm, kỹ năng và chuẩn đầu ra..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Ghi chú sư phạm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú sư phạm & Đồ dùng dạy học</label>
                <input
                  type="text"
                  value={lessonFormData.note}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, note: e.target.value })}
                  placeholder="VD: Chuẩn bị máy chiếu, phiếu bài tập nhóm..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingLesson ? 'Cập nhật bài học' : 'Lưu bài học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT BÀI HỌC */}
      {/* ========================================================================= */}
      {viewingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    {viewingLesson.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Khối {viewingLesson.grade}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{viewingLesson.title}</h3>
              </div>
              <button
                onClick={() => setViewingLesson(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Môn học:</span>
                <span className="font-bold text-slate-900">{viewingLesson.subjectName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Chương / Unit:</span>
                <span className="font-bold text-slate-800">{viewingLesson.chapter} (Bài số {viewingLesson.order})</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Mô tả tóm tắt nội dung:</span>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                  {viewingLesson.shortDescription || 'Không có mô tả chi tiết.'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Ghi chú sư phạm:</span>
                <p className="text-xs text-slate-700 bg-amber-50/60 border border-amber-100 p-3 rounded-xl leading-relaxed">
                  {viewingLesson.note || 'Không có ghi chú.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const toEdit = viewingLesson;
                  setViewingLesson(null);
                  handleOpenEditLesson(toEdit);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Chỉnh sửa bài học
              </button>
              <button
                onClick={() => setViewingLesson(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SUBJECT MODAL */}
      <ConfirmModal
        isOpen={!!subjectToDelete}
        title={`Xác nhận xóa môn ${subjectToDelete?.name || ''}?`}
        message={`Bạn có chắc chắn muốn xóa môn học ${subjectToDelete?.name} (Mã: ${subjectToDelete?.code}) khỏi hệ thống?`}
        warningNote={
          subjectToDelete && (subjectToDelete.lessonCount || 0) > 0
            ? `Môn học này đang có ${subjectToDelete.lessonCount} bài học liên kết. Bạn nên cân nhắc kỹ trước khi xóa.`
            : undefined
        }
        confirmLabel="Xóa môn học"
        onConfirm={() => {
          if (!subjectToDelete) return;
          onDeleteSubject(subjectToDelete.id);
          setSubjectToDelete(null);
        }}
        onCancel={() => setSubjectToDelete(null)}
      />

      {/* CONFIRM DELETE LESSON MODAL */}
      <ConfirmModal
        isOpen={!!lessonToDelete}
        title={`Xác nhận xóa bài học "${lessonToDelete?.title || ''}"?`}
        message={`Bạn có chắc chắn muốn xóa bài học ${lessonToDelete?.title} (Mã: ${lessonToDelete?.code}) khỏi hệ thống?`}
        confirmLabel="Xóa bài học"
        onConfirm={() => {
          if (!lessonToDelete) return;
          onDeleteLesson(lessonToDelete.id);
          setLessonToDelete(null);
          if (viewingLesson?.id === lessonToDelete.id) {
            setViewingLesson(null);
          }
        }}
        onCancel={() => setLessonToDelete(null)}
      />
    </div>
  );
};
