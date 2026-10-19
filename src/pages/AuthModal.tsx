import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { Mail, Lock, User, Gift, X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { signUp, logIn, sendPasswordReset } = useAuth();
  const { t } = useThemeLanguage();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!email.trim() || !password || !fullName.trim()) {
          showToast('Please fill in all required fields.', 'error');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          showToast('Password must be at least 6 characters.', 'error');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          showToast('Passwords do not match.', 'error');
          setLoading(false);
          return;
        }

        await signUp(email.trim(), password, fullName.trim(), referralCode.trim());
        showToast('Account registered successfully! Welcome to BDT Earn Pro.', 'success');
        onClose();
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          showToast('Please enter your email and password.', 'error');
          setLoading(false);
          return;
        }

        await logIn(email.trim(), password);
        showToast('Logged in successfully!', 'success');
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          showToast('Please enter your registered email.', 'error');
          setLoading(false);
          return;
        }
        await sendPasswordReset(email.trim());
        setResetSent(true);
        showToast('Password reset link sent to your email!', 'success');
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication error';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please log in.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Header decoration */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ৳
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {mode === 'login' && t('loginTitle')}
                {mode === 'register' && t('registerTitle')}
                {mode === 'forgot' && t('resetPasswordTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'login' && t('loginSubtitle')}
                {mode === 'register' && t('registerSubtitle')}
                {mode === 'forgot' && t('resetPasswordSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'forgot' && resetSent ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white">Check Your Email</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                We sent a password reset link to <span className="font-semibold text-emerald-600">{email}</span>. Click the link to set a new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
                }}
                className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                {t('backToLogin')}
              </button>
            </div>
          ) : (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {t('fullNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Md. Ratan Khan"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      {t('passwordLabel')}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                      >
                        {t('forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t('confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t('referralCodeOptional')}
                    </label>
                    <div className="relative">
                      <Gift className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="BDTXXXXX"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span>{t('loading')}</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && t('navLogin')}
                      {mode === 'register' && t('navRegister')}
                      {mode === 'forgot' && t('sendResetLink')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* Toggle Modes */}
          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            {mode === 'login' ? (
              <div>
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('navRegister')}
                </button>
              </div>
            ) : (
              <div>
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('navLogin')}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
