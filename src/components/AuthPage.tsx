import React, { useState } from 'react';
import { UserAccount, UserRole, ClassItem, SubjectItem } from '../types';
import { authenticateUser, authenticateUserAsync, registerUser, resetPassword } from '../utils/auth';
import {
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  Check,
  AlertCircle,
  LogIn,
  UserPlus,
  HelpCircle,
  X,
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserAccount, rememberMe: boolean) => void;
  onContinueAsGuest: () => void;
  classes: ClassItem[];
  subjects: SubjectItem[];
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
  classes,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // ==========================================
  // LOGIN LOGIC
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim()) {
      setLoginError('Vui lòng nhập tên đăng nhập hoặc địa chỉ email');
      return;
    }

    if (!loginPassword) {
      setLoginError('Vui lòng nhập mật khẩu tài khoản');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await authenticateUserAsync(loginUsername, loginPassword);
      setLoginLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user, rememberMe);
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginLoading(false);
      setLoginError('Lỗi đăng nhập: ' + (err?.message || 'Vui lòng thử lại'));
    }
  };

  // ==========================================
  // REGISTER LOGIC
  // ==========================================
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!regFullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của thầy/cô';
    }

    if (!regUsername.trim()) {
      errors.username = 'Vui lòng chọn tên đăng nhập';
    } else if (regUsername.length < 3) {
      errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9._]+$/.test(regUsername)) {
      errors.username = 'Tên đăng nhập chỉ gồm chữ cái không dấu, số, dấu chấm hoặc gạch dưới';
    }

    if (!regPassword) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (regPassword.length < 3) {
      errors.password = 'Mật khẩu cần tối thiểu 3 ký tự';
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không trùng khớp';
    }

    if (!agreeTerms) {
      errors.terms = 'Thầy/cô cần đồng ý với Quy chế bảo mật dữ liệu học sinh';
    }

    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const res = registerUser({
      fullName: regFullName,
      username: regUsername,
      password: regPassword,
    });

    if (res.success && res.user) {
      setRegSuccessMessage(`Đăng ký thành công tài khoản "${res.user.username}"! Đang chuyển sang đăng nhập...`);
      setTimeout(() => {
        onLoginSuccess(res.user!, true);
      }, 1000);
    } else {
      errors.general = res.message;
      setRegErrors(errors);
    }
  };

  // ==========================================
  // FORGOT PASSWORD LOGIC
  // ==========================================
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setForgotMessage({ text: 'Vui lòng nhập tên đăng nhập hoặc email cần khôi phục', isError: true });
      return;
    }

    const res = resetPassword(forgotInput.trim(), '123');
    if (res.success) {
      setForgotMessage({ text: res.message, isError: false });
    } else {
      setForgotMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="max-w-xl w-full relative z-10 my-auto">
        {/* Header School Brand Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 shadow-xl shadow-sky-600/20 mb-3 border border-sky-400/30">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
            TRƯỜNG THCS LÊ LỢI
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Hệ Thống Quản Lý Hồ Sơ Học Sinh, Lớp Học & Giáo Án Bài Học
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-sky-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Năm học 2026 - 2027
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Tabs switch */}
          <div className="flex rounded-2xl bg-slate-900/80 p-1.5 mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              ĐĂNG NHẬP
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegErrors({});
                setRegSuccessMessage('');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              ĐĂNG KÝ TÀI KHOẢN
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: LOGIN FORM */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="VD: admin hoặc giaovien"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(loginUsername);
                      setForgotMessage(null);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-11 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500 focus:ring-offset-slate-900"
                  />
                  <span>Ghi nhớ phiên đăng nhập này</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 active:from-sky-700 active:to-sky-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <span>Đang kiểm tra...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REGISTER FORM */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {regSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{regSuccessMessage}</span>
                </div>
              )}

              {regErrors.general && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {regErrors.general}
                </div>
              )}

              {/* Họ và tên & Tên đăng nhập */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Họ và tên giáo viên <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="VD: Cô Lê Thị Thu"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  {regErrors.fullName && <p className="text-[11px] text-rose-400 mt-1">{regErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tên đăng nhập <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">@</span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="lethithu"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  {regErrors.username && <p className="text-[11px] text-rose-400 mt-1">{regErrors.username}</p>}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 3 ký tự"
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {regErrors.password && <p className="text-[11px] text-rose-400 mt-1">{regErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nhập lại mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Khớp với mật khẩu trên"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  {regErrors.confirmPassword && <p className="text-[11px] text-rose-400 mt-1">{regErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms check */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 bg-slate-900 border-slate-700 focus:ring-teal-500 mt-0.5"
                  />
                  <span>
                    Tôi cam kết bảo mật thông tin cá nhân của học sinh và dữ liệu sư phạm theo quy định của nhà trường.
                  </span>
                </label>
                {regErrors.terms && <p className="text-[11px] text-rose-400 mt-1">{regErrors.terms}</p>}
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 active:from-teal-700 active:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>HOÀN TẤT ĐĂNG KÝ TÀI KHOẢN</span>
              </button>
            </form>
          )}

          {/* Bottom Guest Mode Link */}
          <div className="pt-4 border-t border-slate-700/60 mt-6 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <span>Vào trải nghiệm nhanh với tư cách Khách xem thử</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer copyright */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Trường THCS Lê Lợi • Dữ liệu được lưu trữ tự động an toàn trên trình duyệt
        </p>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: QUÊN MẬT KHẨU */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-400" />
                Khôi Phục Mật Khẩu
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập tên đăng nhập hoặc địa chỉ email của thầy/cô để đặt lại mật khẩu về mặc định (<strong>123</strong>).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="VD: admin hoặc giaovien"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {forgotMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    forgotMessage.isError
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {forgotMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{forgotMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors"
                >
                  Đặt lại mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
