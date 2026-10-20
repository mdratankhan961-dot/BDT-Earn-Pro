import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Wallet, AdminSession } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  adminSession: AdminSession | null;
  signUp: (email: string, pass: string, name: string, refCode?: string) => Promise<void>;
  logIn: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  adminLogin: (token: string, username: string, role: string) => void;
  adminLogout: () => void;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Admin session separate state
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    const saved = localStorage.getItem('bdt_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BDT';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setWallet(null);
        setLoading(false);
        return;
      }

      // Attach Firestore listeners for User Profile and Wallet
      const userRef = doc(db, 'users', firebaseUser.uid);
      const walletRef = doc(db, 'wallets', firebaseUser.uid);

      // Listen to profile
      const unsubProfile = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile({
              id: snapshot.id,
              email: data.email || firebaseUser.email || '',
              displayName: data.displayName || firebaseUser.displayName || 'Member',
              photoURL: data.photoURL || firebaseUser.photoURL || undefined,
              referralCode: data.referralCode || '',
              referredBy: data.referredBy,
              status: data.status || 'active',
              role: data.role || 'user',
              emailVerified: firebaseUser.emailVerified,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt,
            });
          }
        },
        (error) => {
          console.warn('Profile snapshot notice:', error.message);
        }
      );

      // Listen to wallet
      const unsubWallet = onSnapshot(
        walletRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setWallet({
              id: snapshot.id,
              userId: firebaseUser.uid,
              balance: Number(data.balance) || 0,
              pendingWithdrawal: Number(data.pendingWithdrawal) || 0,
              totalEarned: Number(data.totalEarned) || 0,
              totalWithdrawn: Number(data.totalWithdrawn) || 0,
              taskEarnings: Number(data.taskEarnings) || 0,
              referralEarnings: Number(data.referralEarnings) || 0,
              videoAdEarnings: Number(data.videoAdEarnings) || 0,
              spinEarnings: Number(data.spinEarnings) || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          } else {
            // Initialize wallet if not present
            const initWallet: Wallet = {
              id: firebaseUser.uid,
              userId: firebaseUser.uid,
              balance: 0,
              pendingWithdrawal: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
              taskEarnings: 0,
              referralEarnings: 0,
              videoAdEarnings: 0,
              spinEarnings: 0,
              updatedAt: new Date().toISOString(),
            };
            setDoc(walletRef, initWallet).catch(() => {});
            setWallet(initWallet);
          }
        },
        (error) => {
          console.warn('Wallet snapshot notice:', error.message);
        }
      );

      setLoading(false);

      return () => {
        unsubProfile();
        unsubWallet();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const signUp = async (email: string, pass: string, name: string, refCode?: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }

      // Automatically send email verification link
      try {
        await firebaseSendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Verification email send notice:', e);
      }

      const generatedCode = generateReferralCode();
      const now = new Date().toISOString();

      const userDoc: UserProfile = {
        id: uid,
        email: email.trim().toLowerCase(),
        displayName: name.trim() || 'Member',
        referralCode: generatedCode,
        referredBy: refCode?.trim().toUpperCase() || undefined,
        status: 'active',
        role: 'user',
        emailVerified: false,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, 'users', uid), userDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }

      const walletDoc: Wallet = {
        id: uid,
        userId: uid,
        balance: 0,
        pendingWithdrawal: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        taskEarnings: 0,
        referralEarnings: 0,
        videoAdEarnings: 0,
        spinEarnings: 0,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'wallets', uid), walletDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `wallets/${uid}`);
      }

      // If referred, notify server to register pending referral
      if (refCode && refCode.trim()) {
        fetch('/api/referrals/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            email: email.trim(),
            referralCode: refCode.trim().toUpperCase(),
          }),
        }).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setWallet(null);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await firebaseSendEmailVerification(auth.currentUser);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email.trim());
  };

  const adminLogin = (token: string, username: string, role: string) => {
    const session: AdminSession = {
      token,
      username,
      role,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    setAdminSession(session);
    localStorage.setItem('bdt_admin_session', JSON.stringify(session));
  };

  const adminLogout = () => {
    setAdminSession(null);
    localStorage.removeItem('bdt_admin_session');
  };

  const refreshWallet = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch latest server wallet
      const res = await apiFetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Member',
        }),
      });

      if (res.ok && res.data?.wallet) {
        const w = res.data.wallet;
        setWallet({
          id: currentUser.uid,
          userId: currentUser.uid,
          balance: Number(w.balance) || 0,
          pendingWithdrawal: Number(w.pendingWithdrawal) || 0,
          totalEarned: Number(w.totalEarned) || 0,
          totalWithdrawn: Number(w.totalWithdrawn) || 0,
          taskEarnings: Number(w.taskEarnings) || 0,
          referralEarnings: Number(w.referralEarnings) || 0,
          videoAdEarnings: Number(w.videoAdEarnings) || 0,
          spinEarnings: Number(w.spinEarnings) || 0,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      // 2. Fallback to Firestore wallet document
      const wDoc = await getDoc(doc(db, 'wallets', currentUser.uid));
      if (wDoc.exists()) {
        const data = wDoc.data();
        setWallet({
          id: wDoc.id,
          userId: currentUser.uid,
          balance: Number(data.balance) || 0,
          pendingWithdrawal: Number(data.pendingWithdrawal) || 0,
          totalEarned: Number(data.totalEarned) || 0,
          totalWithdrawn: Number(data.totalWithdrawn) || 0,
          taskEarnings: Number(data.taskEarnings) || 0,
          referralEarnings: Number(data.referralEarnings) || 0,
          videoAdEarnings: Number(data.videoAdEarnings) || 0,
          spinEarnings: Number(data.spinEarnings) || 0,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Wallet refresh error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        wallet,
        loading,
        adminSession,
        signUp,
        logIn,
        logOut,
        sendVerificationEmail,
        sendPasswordReset,
        adminLogin,
        adminLogout,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
