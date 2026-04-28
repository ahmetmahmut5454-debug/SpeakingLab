import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { BotContext } from "./eltBot";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Use Google Auth
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({ prompt: "select_account" });
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
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
testConnection();

export interface UserStats {
  userId: string;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD format
  todaySessions: number;
  xp: number;
  unlockedItems?: string[];
  equippedBadge?: string;
  equippedOutfit?: string;
  updatedAt?: any;
}

const getLocalDateString = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export const getUserStats = async (): Promise<UserStats | null> => {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, "userStats", auth.currentUser.uid);
    const snap = await getDocFromServer(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserStats;
      // Migration for old docs
      let needsUpdate = false;
      if (!data.unlockedItems) {
        data.unlockedItems = ["outfit_default"];
        needsUpdate = true;
      }
      if (!data.equippedBadge) {
        data.equippedBadge = "";
        needsUpdate = true;
      }
      if (!data.equippedOutfit) {
        data.equippedOutfit = "outfit_default";
        needsUpdate = true;
      }
      if (needsUpdate) {
        data.updatedAt = serverTimestamp();
        await setDoc(docRef, data);
      }
      return data;
    } else {
      const defaultStats: UserStats = {
        userId: auth.currentUser.uid,
        streak: 0,
        lastActiveDate: getLocalDateString(),
        todaySessions: 0,
        xp: 0,
        unlockedItems: ["outfit_default"],
        equippedBadge: "",
        equippedOutfit: "outfit_default",
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, defaultStats);
      return defaultStats;
    }
  } catch (error) {
    console.error("Failed to fetch user stats", error);
    return null;
  }
};

export const updateUserPurchase = async (
  newXp: number,
  newUnlockedItems: string[],
  newBadge: string,
  newOutfit: string,
) => {
  if (!auth.currentUser) return null;
  try {
    const uid = auth.currentUser.uid;
    const docRef = doc(db, "userStats", uid);
    const snap = await getDocFromServer(docRef);
    if (!snap.exists()) return null;

    const stats = snap.data() as UserStats;
    const updatedStats: UserStats = {
      ...stats,
      xp: newXp,
      unlockedItems: newUnlockedItems,
      equippedBadge: newBadge,
      equippedOutfit: newOutfit,
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, updatedStats);
    return updatedStats;
  } catch (error) {
    console.error("Failed to update purchase", error);
    return null;
  }
};

// Internal function to update user gamification stats
export const updateGamificationStats = async () => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const today = getLocalDateString();
  const docRef = doc(db, "userStats", uid);

  try {
    const snap = await getDocFromServer(docRef);
    let stats: UserStats = {
      userId: uid,
      streak: 1,
      lastActiveDate: today,
      todaySessions: 1,
      xp: 50, // 50 XP per session
      unlockedItems: ["outfit_default"],
      equippedBadge: "",
      equippedOutfit: "outfit_default",
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      const existing = snap.data() as UserStats;
      const lastDate = existing.lastActiveDate;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setMinutes(
        yesterday.getMinutes() - yesterday.getTimezoneOffset(),
      );
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = existing.streak;
      let newTodaySessions = existing.todaySessions;
      let newXp = existing.xp + 50;

      if (lastDate === today) {
        newTodaySessions += 1;
        // Daily quest: 3 conversations
        if (newTodaySessions === 3) {
          newXp += 200; // Bonus 200 XP!
          console.log("Daily quest completed! +200 XP");
        }
      } else if (lastDate === yesterdayStr) {
        newStreak += 1;
        newTodaySessions = 1;
      } else {
        // Break in streak
        newStreak = 1;
        newTodaySessions = 1;
      }

      stats = {
        userId: uid,
        streak: newStreak,
        lastActiveDate: today,
        todaySessions: newTodaySessions,
        xp: newXp,
        unlockedItems: existing.unlockedItems || ["outfit_default"],
        equippedBadge: existing.equippedBadge || "",
        equippedOutfit: existing.equippedOutfit || "outfit_default",
        updatedAt: serverTimestamp(),
      };
    }

    await setDoc(docRef, stats);
    return stats;
  } catch (error) {
    console.error("Failed to update gamification stats:", error);
    throw error;
  }
};

// Save report to database
export const saveReportToDb = async (
  context: BotContext,
  reportText: string,
) => {
  if (!auth.currentUser) return;

  try {
    await addDoc(collection(db, "reports"), {
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      level: context.level || "",
      mode: context.mode || "",
      topic: context.topic || context.objective || "",
      reportText: reportText || "",
    });
    console.log("Report saved successfully!");

    return true;
  } catch (error: any) {
    console.error("Failed to save report:", error);
    alert(
      "Firebase'e Kayıt Başarısız: " +
        (error.message || String(error)) +
        "\n\nBu hata Firestore Rules (güvenlik kuralları) ile ilgili olabilir.",
    );
  }
};

export interface SavedReport {
  id: string;
  createdAt: { seconds: number; nanoseconds: number } | Date;
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
      collection(db, "reports"),
      where("userId", "==", auth.currentUser.uid),
      // Ordering requires an index in firestore if combined with where, but single equality where + order on another field often needs a composite index.
      // Actually, wait - let's fetch without order and sort locally to avoid index errors initially.
    );
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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
    await deleteDoc(doc(db, "reports", reportId));
  } catch (error) {
    console.error("Failed to delete report:", error);
  }
};
