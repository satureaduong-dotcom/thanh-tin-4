import React, { useState } from 'react';
import { ClassItem, StudentItem, SubjectItem, LessonItem, ActivityLog } from '../types';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';
import { exportAllDataAsJSON, importAllDataFromJSON } from '../utils/storage';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FileSpreadsheet,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  students: StudentItem[];
  subjects: SubjectItem[];
  lessons: LessonItem[];
  logs: ActivityLog[];
  onDataImported: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  subjects,
  lessons,
  logs,
  onDataImported,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'json'>('html');

  if (!isOpen) return null;

  const htmlContent = generateStandaloneHtml(classes, students, subjects, lessons, logs);

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Truong_THCS_Le_Loi_DuLieu.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Đã tải xuống file HTML độc lập thành công!', 'success');
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onShowToast('Đã sao chép toàn bộ mã nguồn HTML vào clipboard!', 'success');
  };

  const handleDownloadJson = () => {
    const jsonContent = exportAllDataAsJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DuLieu_THCS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Đã xuất file dữ liệu JSON sao lưu thành công!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importAllDataFromJSON(content)) {
        onDataImported();
        onShowToast('Đã nhập và khôi phục dữ liệu từ tệp tin thành công!', 'success');
        onClose();
      } else {
        onShowToast('Định dạng tệp JSON không hợp lệ!', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sao Lưu & Xuất Dữ Liệu</h3>
              <p className="text-xs text-slate-500">Tải file HTML chạy offline hoặc tệp sao lưu dữ liệu JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 my-4 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'html' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            File HTML Đơn Lẻ (Chạy Offline)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'json' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sao Lưu / Khôi Phục JSON
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {activeTab === 'html' ? (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 text-teal-900">
                <h4 className="text-sm font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  File HTML Độc Lập Chạy Trực Tiếp
                </h4>
                <p className="text-xs leading-relaxed text-teal-800">
                  File chứa toàn bộ mã nguồn HTML, CSS, JavaScript và dữ liệu hiện tại. Bạn chỉ cần bấm <strong>"Tải xuống file .html"</strong> và mở bằng bất kỳ trình duyệt nào (Chrome, Cốc Cốc, Edge, Safari) mà không cần cài đặt phần mềm hay kết nối internet.
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadHtml}
                  className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải xuống file index.html
                </button>
                <button
                  onClick={handleCopyHtml}
                  className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã sao chép mã nguồn!' : 'Sao chép toàn bộ mã HTML'}
                </button>
              </div>

              {/* Preview code snippet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Xem trước mã nguồn:</label>
                <pre className="p-3.5 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl max-h-48 overflow-auto">
                  {htmlContent.slice(0, 1500)}
                  {htmlContent.length > 1500 && '\n... [Còn tiếp toàn bộ file] ...'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-sky-900">
                <h4 className="text-sm font-bold flex items-center gap-1.5 mb-1">
                  <HardDrive className="w-4 h-4 text-sky-600" />
                  Sao lưu cơ sở dữ liệu học sinh & giáo án
                </h4>
                <p className="text-xs leading-relaxed text-sky-800">
                  Xuất dữ liệu dạng tệp JSON để lưu trữ hoặc chuyển đổi sang máy tính khác của giáo viên một cách an toàn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadJson}
                  className="p-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Xuất file sao lưu .JSON
                </button>

                <label className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Khôi phục từ file .JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
