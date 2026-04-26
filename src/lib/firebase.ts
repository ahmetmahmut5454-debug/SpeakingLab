import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BotContext } from './eltBot';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Use Google Auth
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Test initial connection
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
testConnection();

// Save report to database
export const saveReportToDb = async (context: BotContext, reportText: string) => {
  if (!auth.currentUser) return;
  
  try {
    await addDoc(collection(db, 'reports'), {
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      level: context.level,
      mode: context.mode,
      topic: context.topic,
      reportText: reportText
    });
    console.log("Report saved successfully!");
  } catch (error: any) {
    console.error("Failed to save report:", error);
    alert("Firebase'e Kayıt Başarısız: " + (error.message || String(error)) + "\n\nBu hata Firestore Rules (güvenlik kuralları) ile ilgili olabilir.");
  }
};

export interface SavedReport {
  id: string;
  createdAt: { seconds: number, nanoseconds: number } | Date;
  level: string;
  mode: string;
  topic: string;
  reportText: string;
}

// Fetch user's reports
export const getUserReports = async (): Promise<SavedReport[]> => {
  if (!auth.currentUser) return [];
  
  try {
    const q = query(
      collection(db, 'reports'), 
      where('userId', '==', auth.currentUser.uid)
      // Ordering requires an index in firestore if combined with where, but single equality where + order on another field often needs a composite index. 
      // Actually, wait - let's fetch without order and sort locally to avoid index errors initially.
    );
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SavedReport[];
    
    // Sort locally by creation date descending
    reports.sort((a, b) => {
      const timeA = (a.createdAt as any)?.seconds || 0;
      const timeB = (b.createdAt as any)?.seconds || 0;
      return timeB - timeA;
    });
    
    return reports;
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
};

// Delete a report
export const deleteReportFromDb = async (reportId: string) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (error) {
    console.error("Failed to delete report:", error);
  }
};
