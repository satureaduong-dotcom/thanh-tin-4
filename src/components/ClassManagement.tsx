import React, { useState, useMemo } from 'react';
import { ClassItem, StudentItem, GradeLevel } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Filter,
  GraduationCap,
  Sparkles,
  School,
  X,
  Check,
  AlertCircle,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ClassManagementProps {
  classes: ClassItem[];
  students: StudentItem[];
  onSaveClass: (classData: Omit<ClassItem, 'createdAt' | 'id'> & { id?: string }) => { success: boolean; message: string };
  onDeleteClass: (id: string) => { success: boolean; message: string };
  onViewStudent: (student: StudentItem) => void;
  onAddStudentToClass: (classId: string) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  students,
  onSaveClass,
  onDeleteClass,
  onViewStudent,
  onAddStudentToClass,
}) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [viewingClass, setViewingClass] = useState<ClassItem | null>(null);

  // Delete confirmation
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);

  // Form inputs
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    grade: GradeLevel;
    schoolYear: string;
    teacher: string;
    note: string;
  }>({
    code: '',
    name: '',
    grade: 6,
    schoolYear: '2026-2027',
    teacher: '',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered class list
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrade =
        selectedGrade === 'all' || cls.grade.toString() === selectedGrade;

      return matchSearch && matchGrade;
    });
  }, [classes, searchTerm, selectedGrade]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    // Generate an automatic next code like L007
    const currentCodes = classes.map((c) => parseInt(c.code.replace(/\D/g, '') || '0'));
    const nextNum = Math.max(0, ...currentCodes) + 1;
    const autoCode = `L${nextNum.toString().padStart(3, '0')}`;

    setEditingClass(null);
    setFormData({
      code: autoCode,
      name: '',
      grade: 6,
      schoolYear: '2026-2027',
      teacher: '',
      note: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      code: cls.code,
      name: cls.name,
      grade: cls.grade,
      schoolYear: cls.schoolYear,
      teacher: cls.teacher,
      note: cls.note || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Mã lớp không được để trống';
    } else {
      // Check duplicate code
      const duplicate = classes.find(
        (c) =>
          c.code.toLowerCase() === formData.code.trim().toLowerCase() &&
          (!editingClass || c.id !== editingClass.id)
      );
      if (duplicate) {
        errors.code = `Mã lớp "${formData.code}" đã được sử dụng cho lớp ${duplicate.name}`;
      }
    }

    if (!formData.name.trim()) {
      errors.name = 'Tên lớp không được để trống (ví dụ: 6A1, 7A2)';
    }

    if (!formData.teacher.trim()) {
      errors.teacher = 'Vui lòng nhập họ và tên Giáo viên chủ nhiệm';
    }

    if (!formData.schoolYear.trim()) {
      errors.schoolYear = 'Năm học không được để trống';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = onSaveClass({
      id: editingClass?.id,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      grade: formData.grade,
      schoolYear: formData.schoolYear.trim(),
      teacher: formData.teacher.trim(),
      note: formData.note.trim(),
    });

    if (result.success) {
      setIsFormOpen(false);
      setEditingClass(null);
    }
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!classToDelete) return;
    onDeleteClass(classToDelete.id);
    setClassToDelete(null);
    if (viewingClass?.id === classToDelete.id) {
      setViewingClass(null);
    }
  };

  // Get students of currently viewed class
  const classStudents = useMemo(() => {
    if (!viewingClass) return [];
    return students.filter(
      (s) => s.classId === viewingClass.id || s.className === viewingClass.name
    );
  }, [viewingClass, students]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-sky-600" />
            Danh sách Lớp học THCS
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng <span className="font-bold text-sky-600">{classes.length}</span> lớp học đang hoạt động trong năm học 2026 - 2027
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer hover:scale-102"
        >
          <Plus className="w-5 h-5" />
          Thêm lớp mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lớp, mã lớp, GVCN..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Grade */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Lọc khối:
          </span>
          {['all', '6', '7', '8', '9'].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {grade === 'all' ? 'Tất cả khối' : `Khối ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Class Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredClasses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <School className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy lớp học nào</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              Không có lớp học nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.
            </p>
            {(searchTerm || selectedGrade !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('all');
                }}
                className="px-4 py-2 text-xs font-bold text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Mã lớp</th>
                  <th className="px-5 py-4">Tên lớp</th>
                  <th className="px-5 py-4">Khối</th>
                  <th className="px-5 py-4">Năm học</th>
                  <th className="px-5 py-4">Giáo viên chủ nhiệm</th>
                  <th className="px-5 py-4 text-center">Sĩ số</th>
                  <th className="px-5 py-4">Ghi chú</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => (
                  <tr
                    key={cls.id}
                    className="hover:bg-sky-50/40 transition-colors group"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-sky-700">
                      {cls.code}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">{cls.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                        Khối {cls.grade}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {cls.schoolYear}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{cls.teacher}</div>
                      <div className="text-[11px] text-slate-400">Giáo viên chủ nhiệm</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setViewingClass(cls)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors cursor-pointer"
                        title="Bấm để xem danh sách học sinh"
                      >
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        {cls.studentCount || 0} HS
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                      {cls.note || <span className="text-slate-300 italic">Không có</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingClass(cls)}
                          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết lớp & danh sách học sinh"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin lớp"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setClassToDelete(cls)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa lớp học"
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

      {/* MODAL: THÊM / CHỈNH SỬA LỚP HỌC */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-sky-600" />
                {editingClass ? `Chỉnh sửa Lớp: ${editingClass.name}` : 'Thêm Lớp Học Mới'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row: Mã lớp & Tên lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã lớp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value });
                      if (formErrors.code) setFormErrors({ ...formErrors, code: '' });
                    }}
                    placeholder="VD: L001"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.code ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-300' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                  />
                  {formErrors.code && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên lớp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    placeholder="VD: 6A1, 7A2..."
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.name ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-300' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Row: Khối & Năm học */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Khối học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: parseInt(e.target.value) as GradeLevel })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value={6}>Khối 6 (Lớp 6)</option>
                    <option value={7}>Khối 7 (Lớp 7)</option>
                    <option value={8}>Khối 8 (Lớp 8)</option>
                    <option value={9}>Khối 9 (Lớp 9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Năm học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.schoolYear}
                    onChange={(e) => {
                      setFormData({ ...formData, schoolYear: e.target.value });
                      if (formErrors.schoolYear) setFormErrors({ ...formErrors, schoolYear: '' });
                    }}
                    placeholder="VD: 2026-2027"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.schoolYear ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                  />
                  {formErrors.schoolYear && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.schoolYear}
                    </p>
                  )}
                </div>
              </div>

              {/* GVCN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giáo viên chủ nhiệm (GVCN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => {
                    setFormData({ ...formData, teacher: e.target.value });
                    if (formErrors.teacher) setFormErrors({ ...formErrors, teacher: '' });
                  }}
                  placeholder="VD: Nguyễn Văn An"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.teacher ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                />
                {formErrors.teacher && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.teacher}
                  </p>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú lớp học
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú về đặc điểm lớp, định hướng học tập..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM CHI TIẾT LỚP HỌC & DANH SÁCH HỌC SINH */}
      {viewingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-sky-700 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl font-black">
                  {viewingClass.name}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Hồ sơ Lớp {viewingClass.name}</h3>
                  <p className="text-xs text-sky-100 flex items-center gap-2 mt-0.5">
                    <span>Mã: {viewingClass.code}</span>
                    <span>•</span>
                    <span>Khối {viewingClass.grade}</span>
                    <span>•</span>
                    <span>Năm học: {viewingClass.schoolYear}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingClass(null)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Class Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Giáo viên chủ nhiệm</span>
                  <span className="text-sm font-bold text-slate-900">{viewingClass.teacher}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Sĩ số thực tế</span>
                  <span className="text-sm font-extrabold text-teal-700">{classStudents.length} học sinh</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Ghi chú</span>
                  <span className="text-xs text-slate-700">{viewingClass.note || 'Không có ghi chú'}</span>
                </div>
              </div>

              {/* Student Roster Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-sky-600" />
                    Danh sách học sinh trong lớp ({classStudents.length})
                  </h4>
                  <button
                    onClick={() => {
                      const cId = viewingClass.id;
                      setViewingClass(null);
                      onAddStudentToClass(cId);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm học sinh vào lớp này
                  </button>
                </div>

                {classStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-500">Chưa có học sinh nào được gán vào lớp {viewingClass.name}.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                        <tr>
                          <th className="px-3.5 py-2.5">STT</th>
                          <th className="px-3.5 py-2.5">Mã HS</th>
                          <th className="px-3.5 py-2.5">Họ và tên</th>
                          <th className="px-3.5 py-2.5">Ngày sinh</th>
                          <th className="px-3.5 py-2.5">Giới tính</th>
                          <th className="px-3.5 py-2.5">SĐT Phụ huynh</th>
                          <th className="px-3.5 py-2.5 text-right">Xem hồ sơ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classStudents.map((st, index) => (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 text-slate-400 font-medium">{index + 1}</td>
                            <td className="px-3.5 py-2.5 font-mono font-bold text-sky-700">{st.code}</td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">{st.fullName}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{st.birthDate}</td>
                            <td className="px-3.5 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  st.gender === 'Nữ'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {st.gender}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 font-mono">{st.parentPhone}</td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                onClick={() => {
                                  setViewingClass(null);
                                  onViewStudent(st);
                                }}
                                className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded"
                                title="Xem chi tiết hồ sơ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const toEdit = viewingClass;
                  setViewingClass(null);
                  handleOpenEdit(toEdit);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Chỉnh sửa thông tin lớp
              </button>
              <button
                onClick={() => setViewingClass(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!classToDelete}
        title={`Xác nhận xóa lớp ${classToDelete?.name || ''}?`}
        message={`Bạn có chắc chắn muốn xóa lớp ${classToDelete?.name} (Mã: ${classToDelete?.code}) khỏi hệ thống?`}
        warningNote={
          classToDelete && (classToDelete.studentCount || 0) > 0
            ? `Lớp này hiện đang có ${classToDelete.studentCount} học sinh. Nếu xóa lớp, bạn cần chuyển các học sinh này sang lớp khác để đảm bảo dữ liệu hợp lệ.`
            : undefined
        }
        confirmLabel="Xóa lớp học"
        onConfirm={handleConfirmDelete}
        onCancel={() => setClassToDelete(null)}
      />
    </div>
  );
};
