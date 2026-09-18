import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { StudentItem, ClassItem } from '../types';
import {
  AlertTriangle,
  Trash2,
  X,
  Download,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  School,
} from 'lucide-react';

interface DeleteAllStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStudents: StudentItem[];
  filteredStudents: StudentItem[];
  selectedStudents: StudentItem[];
  currentGradeFilter: string;
  currentClassFilter: string;
  classes: ClassItem[];
  mode: 'all' | 'filtered' | 'selected';
  onConfirmDelete: (mode: 'all' | 'filtered' | 'selected', targetIds?: string[]) => void;
}

export const DeleteAllStudentsModal: React.FC<DeleteAllStudentsModalProps> = ({
  isOpen,
  onClose,
  allStudents,
  filteredStudents,
  selectedStudents,
  currentGradeFilter,
  currentClassFilter,
  classes,
  mode: initialMode,
  onConfirmDelete,
}) => {
  const [deleteScope, setDeleteScope] = useState<'all' | 'filtered' | 'selected'>(initialMode);
  const [confirmText, setConfirmText] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);

  // Sync initialMode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDeleteScope(initialMode);
      setConfirmText('');
      setHasBackedUp(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentClassObj = classes.find((c) => c.id === currentClassFilter);

  // Calculate targets
  let targetStudents: StudentItem[] = [];
  let scopeDescription = '';

  if (deleteScope === 'selected') {
    targetStudents = selectedStudents;
    scopeDescription = `${selectedStudents.length} học sinh đang được chọn`;
  } else if (deleteScope === 'filtered') {
    targetStudents = filteredStudents;
    if (currentClassObj) {
      scopeDescription = `${filteredStudents.length} học sinh thuộc Lớp ${currentClassObj.name}`;
    } else if (currentGradeFilter !== 'all') {
      scopeDescription = `${filteredStudents.length} học sinh thuộc Khối ${currentGradeFilter}`;
    } else {
      scopeDescription = `${filteredStudents.length} học sinh theo kết quả tìm kiếm/lọc hiện tại`;
    }
  } else {
    targetStudents = allStudents;
    scopeDescription = `toàn bộ tất cả ${allStudents.length} học sinh trong toàn trường`;
  }

  const isConfirmed = confirmText.trim().toUpperCase() === 'XOA' || confirmText.trim().toUpperCase() === 'XÓA';

  // Excel backup helper
  const handleBackupBeforeDelete = () => {
    const dataToExport = targetStudents.map((s, index) => ({
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
    XLSX.utils.book_append_sheet(wb, ws, 'Sao_Luu_Hoc_Sinh');
    XLSX.writeFile(wb, `Sao_Luu_Hoc_Sinh_Truoc_Khi_Xoa_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setHasBackedUp(true);
  };

  const handleExecute = () => {
    if (!isConfirmed) return;

    if (deleteScope === 'selected') {
      onConfirmDelete('selected', selectedStudents.map((s) => s.id));
    } else if (deleteScope === 'filtered') {
      onConfirmDelete('filtered', filteredStudents.map((s) => s.id));
    } else {
      onConfirmDelete('all');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-rose-100 flex items-start justify-between bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">
                Xác Nhận Xóa Dữ Liệu Học Sinh
              </h3>
              <p className="text-xs text-rose-700">
                Hành động này sẽ xóa dữ liệu vĩnh viễn khỏi hệ thống quản lý
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Scope Selector if multiple scopes available */}
          {initialMode !== 'selected' && (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Chọn phạm vi muốn xóa:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteScope('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deleteScope === 'all'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-bold ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-xs font-bold mb-0.5">Toàn bộ trường ({allStudents.length} HS)</span>
                  <span className="text-[11px] font-normal text-slate-500 block">Xóa sạch toàn bộ học sinh trong hệ thống</span>
                </button>

                {(currentClassFilter !== 'all' || currentGradeFilter !== 'all' || filteredStudents.length !== allStudents.length) && (
                  <button
                    type="button"
                    onClick={() => setDeleteScope('filtered')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      deleteScope === 'filtered'
                        ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs font-bold mb-0.5">Theo bộ lọc ({filteredStudents.length} HS)</span>
                    <span className="text-[11px] font-normal text-slate-500 block">Chỉ xóa các học sinh đang lọc</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Warning Card */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cảnh báo quan trọng:</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Bạn đang chuẩn bị xóa <strong>{scopeDescription}</strong>. Dữ liệu sau khi xóa sẽ không thể tự phục hồi nếu bạn chưa lưu trữ bản sao.
            </p>
          </div>

          {/* Backup recommendation CTA */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 text-xs block">Khuyến nghị tạo bản sao lưu:</span>
              <span className="text-[11px] text-slate-500">
                Tải file Excel chứa danh sách này về máy tính phòng khi cần dùng lại.
              </span>
            </div>
            <button
              type="button"
              onClick={handleBackupBeforeDelete}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                hasBackedUp
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-teal-700 hover:bg-teal-50 border-teal-200 shadow-2xs'
              }`}
            >
              {hasBackedUp ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã tải file sao lưu
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-teal-600" />
                  Tải file sao lưu (.xlsx)
                </>
              )}
            </button>
          </div>

          {/* Security confirmation input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Nhập chữ <span className="text-rose-600 font-mono font-extrabold bg-rose-100 px-1.5 py-0.5 rounded">XOA</span> vào ô bên dưới để xác nhận:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Nhập XOA để mở khóa nút xóa"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-transparent hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!isConfirmed || targetStudents.length === 0}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Xác nhận xóa vĩnh viễn ({targetStudents.length} HS)
          </button>
        </div>
      </div>
    </div>
  );
};
