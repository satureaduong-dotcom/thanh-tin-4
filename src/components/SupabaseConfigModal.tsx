import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  RefreshCw,
  Server,
  Key,
  Terminal,
  ExternalLink,
  X,
  Triangle,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../utils/supabase';
import {
  pushAllLocalDataToSupabase,
  pullAllDataFromSupabase,
  SUPABASE_SQL_SETUP_SCRIPT,
} from '../utils/supabaseSync';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onShowToast,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setKey(cfg.key);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    saveSupabaseConfig(url, key);

    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handlePushData = async () => {
    setIsPushing(true);
    const res = await pushAllLocalDataToSupabase();
    setIsPushing(false);
    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handlePullData = async () => {
    setIsPulling(true);
    const res = await pullAllDataFromSupabase();
    setIsPulling(false);
    if (res.success) {
      onRefreshData();
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    onShowToast('Đã sao chép mã tạo bảng SQL vào bộ nhớ tạm!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Kết Nối Cơ Sở Dữ Liệu Supabase
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud PostgreSQL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Đồng bộ tài khoản, lớp học, học sinh, giáo án và nhật ký thời gian thực
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Credentials Inputs */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://vrbhoishctpxzkndgjiz.supabase.co"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Supabase API Key (anon public key)
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sb_publishable_... hoặc eyJhbGciOi..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang kiểm tra kết nối...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lưu & Kiểm tra kết nối
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Operations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  Tải dữ liệu lên Supabase
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Đẩy toàn bộ tài khoản, danh sách lớp, học sinh và bài học hiện tại lên bảng Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePushData}
                disabled={isPushing}
                className="w-full py-2 bg-sky-600/90 hover:bg-sky-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {isPushing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                Đồng bộ lên Cloud (Push)
              </button>
            </div>

            <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-2 mb-1">
                  <DownloadCloud className="w-4 h-4 text-teal-400" />
                  Tải dữ liệu từ Supabase về
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Cập nhật các bản ghi mới nhất từ Cloud Supabase về giao diện của ứng dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullData}
                disabled={isPulling}
                className="w-full py-2 bg-teal-600/90 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {isPulling ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <DownloadCloud className="w-3.5 h-3.5" />
                )}
                Tải về từ Cloud (Pull)
              </button>
            </div>
          </div>

          {/* SQL Tables Script Setup Guide */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Mã SQL Tạo Bảng Trên Supabase (Khởi tạo 1 lần)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {showSql ? 'Thu gọn' : 'Xem mã SQL'}
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Sao chép SQL
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              Nếu dự án Supabase của bạn mới tinh chưa có bảng, chỉ cần vào{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
              >
                Supabase SQL Editor <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
              , dán đoạn mã này vào và nhấn <strong>Run</strong>.
            </p>

            {showSql && (
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[10px] overflow-x-auto max-h-48 leading-relaxed">
                {SUPABASE_SQL_SETUP_SCRIPT}
              </pre>
            )}
          </div>

          {/* Vercel Deployment & Environment Integration Guide */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold">
                <Triangle className="w-3 h-3 fill-black text-black" />
              </div>
              <span className="font-bold text-white text-xs">Kết nối dự án Vercel với Supabase</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Khi triển khai ứng dụng lên <strong>Vercel</strong>, anh chỉ cần thêm 2 biến môi trường sau trong phần <strong>Project Settings &gt; Environment Variables</strong> của Vercel:
            </p>
            <div className="space-y-1.5 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center text-sky-400">
                <span>VITE_SUPABASE_URL</span>
                <span className="text-slate-400 text-[10px] truncate max-w-[260px]">https://vrbhoishctpxzkndgjiz.supabase.co</span>
              </div>
              <div className="flex justify-between items-center text-teal-400">
                <span>VITE_SUPABASE_ANON_KEY</span>
                <span className="text-slate-400 text-[10px] truncate max-w-[260px]">sb_publishable_U698CDnMn6MVrYjCSJkcjw_q3p1Hg--</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Đã cấu hình sẵn tập tin <code className="text-emerald-400">vercel.json</code> hỗ trợ SPA routing, đảm bảo không bị lỗi 404 khi người dùng tải lại trang.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu luôn được sao lưu an toàn 2 chiều (Cloud + Cục bộ).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition cursor-pointer text-xs"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
