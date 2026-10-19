import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCU6T5EjYERS013LtbZIokCWcdGfwxyzo4",
  authDomain: "bdt-earn-pro.firebaseapp.com",
  projectId: "bdt-earn-pro",
  storageBucket: "bdt-earn-pro.firebasestorage.app",
  messagingSenderId: "26614115540",
  appId: "1:26614115540:web:3fdf151819d85ca7d75f41",
  measurementId: "G-BY0H85XQQ7",
  firestoreDatabaseId: "(default)"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Analytics
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
        } catch (err) {
          console.warn('Firebase Analytics initialization notice:', err);
        }
      }
    })
    .catch((err) => {
      console.warn('Analytics not supported in this environment:', err);
    });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Automatically test connection when imported
testConnection().catch(() => {});

export default app;
