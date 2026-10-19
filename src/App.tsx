import React, { useState, useEffect } from 'react';
import { ThemeLanguageProvider, useThemeLanguage } from './context/ThemeLanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NoticeBanner } from './components/NoticeBanner';
import { AuthModal } from './pages/AuthModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { ReferEarnPage } from './pages/ReferEarnPage';
import { WatchAdsPage } from './pages/WatchAdsPage';
import { SpinWinPage } from './pages/SpinWinPage';
import { WalletPage } from './pages/WalletPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const { t } = useThemeLanguage();

  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [noticeText, setNoticeText] = useState<string>(
    'Withdrawals via bKash, Nagad, and Rocket processed within 1-24 hours. Minimum payout ৳50.'
  );

  useEffect(() => {
    // If user is authenticated, default to dashboard if on landing
    if (currentUser && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [currentUser]);

  useEffect(() => {
    // Fetch global notice if available
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.appSettings?.noticeText) {
          setNoticeText(data.appSettings.noticeText);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-emerald-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-2xl animate-pulse">
            ৳
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-gray-400">
            Loading BDT Earn Pro...
          </span>
        </div>
      </div>
    );
  }

  const showSidebar = currentUser && currentPage !== 'landing';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Announcement & Verification notices */}
      <NoticeBanner noticeText={noticeText} />

      {/* Top Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {/* Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {showSidebar && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-hidden">
          {/* Unauthenticated Landing View */}
          {!currentUser && currentPage === 'landing' && (
            <LandingPage
              onGetStarted={() => handleOpenAuth('register')}
              onLogin={() => handleOpenAuth('login')}
            />
          )}

          {/* User Logged In Pages */}
          {(currentUser || currentPage !== 'landing') && (
            <>
              {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
              {currentPage === 'tasks' && <TasksPage />}
              {currentPage === 'refer' && <ReferEarnPage />}
              {currentPage === 'ads' && <WatchAdsPage />}
              {currentPage === 'spin' && <SpinWinPage />}
              {currentPage === 'wallet' && <WalletPage onNavigate={handleNavigate} />}
              {currentPage === 'withdraw' && <WithdrawPage />}
              {currentPage === 'profile' && <ProfilePage />}
              {currentPage === 'admin' && <AdminPage />}
              {currentPage === 'landing' && !currentUser && (
                <LandingPage
                  onGetStarted={() => handleOpenAuth('register')}
                  onLogin={() => handleOpenAuth('login')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {currentUser && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeLanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeLanguageProvider>
  );
}
