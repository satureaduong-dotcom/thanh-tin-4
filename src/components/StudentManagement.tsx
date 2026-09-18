import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { StudentItem, ClassItem, GradeLevel } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  GraduationCap,
  ArrowUpDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileText,
  School,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldAlert,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { StudentExcelModal } from './StudentExcelModal';
import { DeleteAllStudentsModal } from './DeleteAllStudentsModal';

interface StudentManagementProps {
  students: StudentItem[];
  classes: ClassItem[];
  preSelectedStudent?: StudentItem | null;
  onClearPreSelectedStudent?: () => void;
  preSelectedClassIdForAdd?: string | null;
  onClearPreSelectedClassId?: () => void;
  onSaveStudent: (studentData: Omit<StudentItem, 'createdAt' | 'id'> & { id?: string }) => { success: boolean; message: string };
  onDeleteStudent: (id: string) => { success: boolean; message: string };
  onDeleteMultipleStudents?: (ids: string[]) => { success: boolean; count: number };
  onDeleteAllStudents?: (filterParams?: { classId?: string; grade?: string }) => { success: boolean; count: number };
  onImportStudents?: (
    studentsToImport: (Omit<StudentItem, 'createdAt' | 'id'> & { id?: string })[]
  ) => { success: boolean; addedCount: number; updatedCount: number };
}

type SortField = 'name' | 'code' | 'birthDate';
type SortOrder = 'asc' | 'desc';

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  classes,
  preSelectedStudent,
  onClearPreSelectedStudent,
  preSelectedClassIdForAdd,
  onClearPreSelectedClassId,
  onSaveStudent,
  onDeleteStudent,
  onDeleteMultipleStudents,
  onDeleteAllStudents,
  onImportStudents,
}) => {
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Multi-Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteModalScope, setDeleteModalScope] = useState<'all' | 'filtered' | 'selected'>('all');
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentItem | null>(preSelectedStudent || null);
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null);

  // Form Data
  const [formData, setFormData] = useState<{
    code: string;
    fullName: string;
    birthDate: string;
    gender: 'Nam' | 'Nữ';
    classId: string;
    parentPhone: string;
    parentEmail: string;
    address: string;
    note: string;
  }>({
    code: '',
    fullName: '',
    birthDate: '2013-01-01',
    gender: 'Nam',
    classId: classes[0]?.id || '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Trigger viewing student if preSelectedStudent changes
  React.useEffect(() => {
    if (preSelectedStudent) {
      setViewingStudent(preSelectedStudent);
      onClearPreSelectedStudent?.();
    }
  }, [preSelectedStudent, onClearPreSelectedStudent]);

  // Trigger add form with pre-selected class if requested
  React.useEffect(() => {
    if (preSelectedClassIdForAdd) {
      handleOpenAdd(preSelectedClassIdForAdd);
      onClearPreSelectedClassId?.();
    }
  }, [preSelectedClassIdForAdd, onClearPreSelectedClassId]);

  // Open Form for Adding
  const handleOpenAdd = (targetClassId?: string) => {
    // Generate next code like HS011
    const currentCodes = students.map((s) => parseInt(s.code.replace(/\D/g, '') || '0'));
    const nextNum = Math.max(0, ...currentCodes) + 1;
    const autoCode = `HS${nextNum.toString().padStart(3, '0')}`;

    setEditingStudent(null);
    setFormData({
      code: autoCode,
      fullName: '',
      birthDate: '2013-05-15',
      gender: 'Nam',
      classId: targetClassId || classes[0]?.id || '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      note: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      code: student.code,
      fullName: student.fullName,
      birthDate: student.birthDate,
      gender: student.gender,
      classId: student.classId,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      note: student.note || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Mã học sinh không được để trống';
    } else {
      const duplicate = students.find(
        (s) =>
          s.code.toLowerCase() === formData.code.trim().toLowerCase() &&
          (!editingStudent || s.id !== editingStudent.id)
      );
      if (duplicate) {
        errors.code = `Mã học sinh "${formData.code}" đã thuộc về học sinh ${duplicate.fullName}`;
      }
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập đầy đủ họ và tên học sinh';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Vui lòng chọn ngày sinh';
    }

    if (!formData.classId) {
      errors.classId = 'Vui lòng chọn lớp học cho học sinh';
    }

    if (!formData.parentPhone.trim()) {
      errors.parentPhone = 'Vui lòng nhập số điện thoại phụ huynh';
    } else if (!/^[0-9+() -]{9,15}$/.test(formData.parentPhone.trim())) {
      errors.parentPhone = 'Số điện thoại không hợp lệ (9-15 chữ số)';
    }

    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail.trim())) {
      errors.parentEmail = 'Email không hợp lệ';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedClass = classes.find((c) => c.id === formData.classId);
    if (!matchedClass) {
      setFormErrors({ classId: 'Lớp học không hợp lệ hoặc đã bị xóa' });
      return;
    }

    const result = onSaveStudent({
      id: editingStudent?.id,
      code: formData.code.trim().toUpperCase(),
      fullName: formData.fullName.trim(),
      birthDate: formData.birthDate,
      gender: formData.gender,
      classId: matchedClass.id,
      className: matchedClass.name,
      grade: matchedClass.grade,
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim() || undefined,
      address: formData.address.trim() || undefined,
      note: formData.note.trim() || undefined,
    });

    if (result.success) {
      setIsFormOpen(false);
      setEditingStudent(null);
    }
  };

  // Delete handler
  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    onDeleteStudent(studentToDelete.id);
    setStudentToDelete(null);
    if (viewingStudent?.id === studentToDelete.id) {
      setViewingStudent(null);
    }
  };

  // Filter and Sort Pipeline
  const filteredAndSortedStudents = useMemo(() => {
    const list = students.filter((s) => {
      // Search match
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
        (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()));

      // Grade match
      const matchGrade = selectedGrade === 'all' || s.grade.toString() === selectedGrade;

      // Class match
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;

      // Gender match
      const matchGender = selectedGender === 'all' || s.gender === selectedGender;

      return matchSearch && matchGrade && matchClass && matchGender;
    });

    // Sorting
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        // Sort by Vietnamese first name (extract last word in full name)
        const nameA = a.fullName.split(' ').pop() || a.fullName;
        const nameB = b.fullName.split(' ').pop() || b.fullName;
        comparison = nameA.localeCompare(nameB, 'vi');
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'birthDate') {
        comparison = new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [students, searchTerm, selectedGrade, selectedClassId, selectedGender, sortField, sortOrder]);

  // Pagination calculation
  const totalStudentsCount = filteredAndSortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (currentPageClamped - 1) * pageSize;
    return filteredAndSortedStudents.slice(start, start + pageSize);
  }, [filteredAndSortedStudents, currentPageClamped, pageSize]);

  // Toggle sort direction
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Selected student objects
  const selectedStudents = useMemo(() => {
    const set = new Set(selectedStudentIds);
    return students.filter((s) => set.has(s.id));
  }, [students, selectedStudentIds]);

  // Selection handlers
  const isAllPageSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false;
    return paginatedStudents.every((s) => selectedStudentIds.includes(s.id));
  }, [paginatedStudents, selectedStudentIds]);

  const isSomePageSelected = useMemo(() => {
    return paginatedStudents.some((s) => selectedStudentIds.includes(s.id)) && !isAllPageSelected;
  }, [paginatedStudents, selectedStudentIds, isAllPageSelected]);

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedStudents.map((s) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAndSortedStudents.map((s) => s.id);
    setSelectedStudentIds(allFilteredIds);
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Export selected to Excel
  const handleExportSelectedExcel = () => {
    if (selectedStudents.length === 0) return;

    const dataToExport = selectedStudents.map((s, index) => ({
      'STT': index + 1,
      'Mã Học Sinh': s.code,
      'Họ và Tên': s.fullName,
      'Ngày Sinh': s.birthDate,
      'Giới Tính': s.gender,
      'Lớp Học': s.className || '',
      'Khối': `Khối ${s.grade}`,
      'SĐT Phụ Huynh': s.parentPhone,
      'Email Phụ Huynh': s.parentEmail || '',
      'Địa Chỉ': s.address || '',
      'Ghi Chú': s.note || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 24 },
      { wch: 30 },
      { wch: 25 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hoc_Sinh_Da_Chon');
    XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_Da_Chon_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Handle Delete All / Bulk execution
  const handleExecuteDelete = (scope: 'all' | 'filtered' | 'selected', targetIds?: string[]) => {
    if (scope === 'all') {
      if (onDeleteAllStudents) {
        onDeleteAllStudents();
      } else {
        students.forEach((s) => onDeleteStudent(s.id));
      }
      setSelectedStudentIds([]);
    } else if (scope === 'filtered') {
      const idsToDelete = targetIds || filteredAndSortedStudents.map((s) => s.id);
      if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteStudent(id));
      }
      setSelectedStudentIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    } else if (scope === 'selected') {
      const idsToDelete = targetIds || selectedStudentIds;
      if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteStudent(id));
      }
      setSelectedStudentIds([]);
    }
  };

  // Export current list to Excel
  const handleExportExcel = () => {
    if (filteredAndSortedStudents.length === 0) {
      alert('Không có học sinh nào trong danh sách để xuất file!');
      return;
    }

    const dataToExport = filteredAndSortedStudents.map((s, index) => ({
      'STT': index + 1,
      'Mã Học Sinh': s.code,
      'Họ và Tên': s.fullName,
      'Ngày Sinh': s.birthDate,
      'Giới Tính': s.gender,
      'Lớp Học': s.className || '',
      'Khối': `Khối ${s.grade}`,
      'SĐT Phụ Huynh': s.parentPhone,
      'Email Phụ Huynh': s.parentEmail || '',
      'Địa Chỉ': s.address || '',
      'Ghi Chú': s.note || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 24 },
      { wch: 30 },
      { wch: 25 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Hoc_Sinh');
    XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_THCS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            Hồ sơ & Danh sách Học sinh THCS
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng <span className="font-bold text-teal-600">{students.length}</span> học sinh đã được lập hồ sơ quản lý
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Xóa Tất Cả / Xóa Dữ Liệu */}
          {students.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setDeleteModalScope('all');
                setIsDeleteAllModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer border border-rose-200 hover:border-rose-300"
              title="Mở hộp thoại xóa toàn bộ hoặc xóa theo bộ lọc học sinh"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Xóa tất cả
            </button>
          )}

          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer border border-slate-200"
            title="Xuất danh sách học sinh ra file Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Xuất Excel
          </button>

          {/* Nút Nhập Excel Hàng Loạt */}
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-102"
            title="Nhập hàng loạt danh sách học sinh từ file Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nhập Excel
          </button>

          {/* Nút Tiếp nhận đơn lẻ */}
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            Tiếp nhận thủ công
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search & Sort line */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên học sinh, mã HS, SĐT phụ huynh..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
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

          {/* Quick Sort Options */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Sắp xếp:</span>
            <button
              onClick={() => handleSortToggle('name')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sortField === 'name' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Họ tên {sortField === 'name' ? (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)') : ''}</span>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSortToggle('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                sortField === 'code' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Mã HS</span>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Line */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Lọc Khối */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lọc theo khối
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Tất cả các khối (6, 7, 8, 9)</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          {/* Lọc Lớp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lọc theo lớp học
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name} (Khối {cls.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Giới tính */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lọc theo giới tính
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result stats line & Selected Actions Bar */}
      {selectedStudentIds.length > 0 ? (
        <div className="bg-teal-700 text-white px-4 py-3 rounded-2xl shadow-md shadow-teal-700/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-teal-800 font-bold text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs sm:text-sm font-semibold">
              Đã chọn <strong className="font-extrabold">{selectedStudentIds.length}</strong> / {totalStudentsCount} học sinh
            </span>
            {selectedStudentIds.length < filteredAndSortedStudents.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs text-teal-200 hover:text-white underline font-medium cursor-pointer ml-2"
              >
                (Chọn tất cả {filteredAndSortedStudents.length} HS theo bộ lọc)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-teal-800/80 hover:bg-teal-800 text-xs font-semibold rounded-xl text-teal-100 hover:text-white transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>

            <button
              type="button"
              onClick={handleExportSelectedExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-teal-800 hover:bg-teal-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Xuất các học sinh đã chọn ra file Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất ({selectedStudentIds.length}) Excel
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteModalScope('selected');
                setIsDeleteAllModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Xóa các học sinh đã chọn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa ({selectedStudentIds.length}) HS đã chọn
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Đang hiển thị <strong className="text-slate-800">{paginatedStudents.length}</strong> / <strong className="text-slate-800">{totalStudentsCount}</strong> học sinh phù hợp
          </span>
          {(searchTerm || selectedGrade !== 'all' || selectedClassId !== 'all' || selectedGender !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGrade('all');
                setSelectedClassId('all');
                setSelectedGender('all');
                setCurrentPage(1);
              }}
              className="text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Student Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {totalStudentsCount === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy học sinh nào</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại các bộ lọc lớp/khối.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="w-10 px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectPage}
                      className="text-slate-500 hover:text-teal-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center"
                      title={isAllPageSelected ? "Bỏ chọn trang này" : "Chọn toàn bộ trang này"}
                    >
                      {isAllPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-teal-600" />
                      ) : isSomePageSelected ? (
                        <MinusSquare className="w-4 h-4 text-teal-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-4">Mã HS</th>
                  <th className="px-4 py-4">Họ và tên</th>
                  <th className="px-4 py-4">Ngày sinh</th>
                  <th className="px-4 py-4">Giới tính</th>
                  <th className="px-4 py-4">Lớp / Khối</th>
                  <th className="px-4 py-4">SĐT Phụ huynh</th>
                  <th className="px-4 py-4">Email phụ huynh</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-teal-50/50 hover:bg-teal-50/80' : 'hover:bg-teal-50/30'
                      }`}
                    >
                      {/* Checkbox item */}
                      <td className="w-10 px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectStudent(student.id)}
                          className="text-slate-400 hover:text-teal-600 focus:outline-none transition-colors cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-teal-700">
                        {student.code}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 text-base">{student.fullName}</div>
                        {student.address && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{student.address}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {student.birthDate}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            student.gender === 'Nữ'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                          <School className="w-3 h-3 text-teal-600" />
                          {student.className || 'Chưa gán'}
                          <span className="text-slate-400 font-normal">| K{student.grade}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.parentPhone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {student.parentEmail ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{student.parentEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết hồ sơ học sinh"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa hồ sơ học sinh"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang <strong>{currentPageClamped}</strong> trên <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPageClamped === 1}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPageClamped === page
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageClamped === totalPages}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: THÊM / CHỈNH SỬA HỌC SINH */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                {editingStudent ? `Chỉnh sửa hồ sơ: ${editingStudent.fullName}` : 'Tiếp Nhận Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 py-4 pr-1">
              {/* Row 1: Mã HS & Họ tên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value });
                      if (formErrors.code) setFormErrors({ ...formErrors, code: '' });
                    }}
                    placeholder="VD: HS001"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.code ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {formErrors.code && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                    }}
                    placeholder="VD: Nguyễn Minh Anh"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.fullName ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.fullName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Ngày sinh, Giới tính, Lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => {
                      setFormData({ ...formData, birthDate: e.target.value });
                      if (formErrors.birthDate) setFormErrors({ ...formErrors, birthDate: '' });
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {formErrors.birthDate && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.birthDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phân lớp học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      setFormData({ ...formData, classId: e.target.value });
                      if (formErrors.classId) setFormErrors({ ...formErrors, classId: '' });
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Khối {cls.grade} - {cls.teacher})
                      </option>
                    ))}
                  </select>
                  {formErrors.classId && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.classId}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: SĐT phụ huynh & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => {
                      setFormData({ ...formData, parentPhone: e.target.value });
                      if (formErrors.parentPhone) setFormErrors({ ...formErrors, parentPhone: '' });
                    }}
                    placeholder="VD: 0912345678"
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      formErrors.parentPhone ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {formErrors.parentPhone && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.parentPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email phụ huynh (Nếu có)
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, parentEmail: e.target.value });
                      if (formErrors.parentEmail) setFormErrors({ ...formErrors, parentEmail: '' });
                    }}
                    placeholder="VD: phuhuynh@gmail.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {formErrors.parentEmail && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.parentEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Địa chỉ thường trú / liên hệ
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: Số 15, Phố Huế, Quận Hai Bà Trưng, Hà Nội"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú hồ sơ học sinh
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Thành tích, năng khiếu, tình trạng sức khỏe hoặc lưu ý sư phạm..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingStudent ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM HỒ SƠ CHI TIẾT HỌC SINH */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header with avatar */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {viewingStudent.fullName.charAt(viewingStudent.fullName.lastIndexOf(' ') + 1) || 'H'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{viewingStudent.fullName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        viewingStudent.gender === 'Nữ'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {viewingStudent.gender}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Mã học sinh: <strong className="text-teal-700">{viewingStudent.code}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile detail cards */}
            <div className="py-5 space-y-4">
              {/* Class and Academic Info */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Lớp học hiện tại</span>
                  <span className="text-base font-extrabold text-slate-900">
                    Lớp {viewingStudent.className}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Khối cấp THCS</span>
                  <span className="text-base font-bold text-teal-800">
                    Khối {viewingStudent.grade}
                  </span>
                </div>
              </div>

              {/* Personal and Contact info */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-28 shrink-0">Ngày sinh:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.birthDate}</span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-28 shrink-0">SĐT Phụ huynh:</span>
                  <span className="font-semibold text-slate-800 font-mono">{viewingStudent.parentPhone}</span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-28 shrink-0">Email liên hệ:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.parentEmail || 'Chưa cung cấp'}</span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-500 w-28 shrink-0">Địa chỉ cư trú:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.address || 'Chưa cập nhật'}</span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-500 w-28 shrink-0">Ghi chú sư phạm:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.note || 'Không có ghi chú'}</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const toEdit = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(toEdit);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Sửa thông tin hồ sơ
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title={`Xác nhận xóa học sinh ${studentToDelete?.fullName || ''}?`}
        message={`Bạn có chắc chắn muốn xóa hồ sơ học sinh ${studentToDelete?.fullName} (Mã: ${studentToDelete?.code}) khỏi hệ thống?`}
        confirmLabel="Xóa học sinh"
        onConfirm={handleConfirmDelete}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* MODAL: NHẬP EXCEL HÀNG LOẠT */}
      <StudentExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        classes={classes}
        existingStudents={students}
        onImportStudents={
          onImportStudents ||
          ((list) => {
            list.forEach((st) => onSaveStudent(st));
            return { success: true, addedCount: list.length, updatedCount: 0 };
          })
        }
      />

      {/* MODAL: XÓA TẤT CẢ / XÓA HÀNG LOẠT HỌC SINH */}
      <DeleteAllStudentsModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        allStudents={students}
        filteredStudents={filteredAndSortedStudents}
        selectedStudents={selectedStudents}
        currentGradeFilter={selectedGrade}
        currentClassFilter={selectedClassId}
        classes={classes}
        mode={deleteModalScope}
        onConfirmDelete={handleExecuteDelete}
      />
    </div>
  );
};
