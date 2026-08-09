import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
  setDoc,
  limit,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { BotContext } from "./eltBot";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();


export const loginWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      await signInWithPopup(auth, googleProvider);
    } else {
      console.error("Login failed", error);
      throw error;
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

const testConnection = async () => {
  try {
    await getDoc(doc(db, "test", "connection"));
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
  displayName?: string;
  photoURL?: string;
  streak: number;
  lastActiveDate: string;
  todaySessions: number;
  todayTaskSessions?: number;
  xp: number;
  daily?: Record<string, number>;
  monthly?: Record<string, number>;
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

const getLocalMonthString = (): string => {
  return getLocalDateString().substring(0, 7);
};

export const getUserStats = async (): Promise<UserStats | null> => {
  if (!auth.currentUser) return null;
  
  try {
    const docRef = doc(db, "userStats", auth.currentUser.uid);
    const snap = await getDoc(docRef);
    const today = getLocalDateString();
    const currentMonth = getLocalMonthString();

    if (snap.exists()) {
      const data = snap.data() as UserStats;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let needsUpdate = false;

      if (data.lastActiveDate !== today) {
        if (data.todaySessions !== 0 || data.todayTaskSessions !== 0) {
          data.todaySessions = 0;
          data.todayTaskSessions = 0;
          needsUpdate = true;
        }
        if (data.lastActiveDate !== yesterdayStr && data.streak !== 0) {
          data.streak = 0;
          needsUpdate = true;
        }
      }

      if (!data.daily) {
        data.daily = {};
        needsUpdate = true;
      }
      if (!data.monthly) {
        data.monthly = {};
        needsUpdate = true;
      }
      if (!data.unlockedItems) {
        data.unlockedItems = ["outfit_default"];
        needsUpdate = true;
      }
      
      const isAnon = auth.currentUser.isAnonymous;
      const defaultName = isAnon ? "Guest Scholar" : "Unknown Scholar";
      if (!data.displayName || (!isAnon && data.displayName === "Guest Scholar") || data.displayName !== (auth.currentUser.displayName || defaultName)) {
        data.displayName = auth.currentUser.displayName || defaultName;
        data.photoURL = auth.currentUser.photoURL || "";
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
      const isAnon = auth.currentUser.isAnonymous;
      const defaultStats: UserStats = {
        userId: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || (isAnon ? "Guest Scholar" : "Unknown Scholar"),
        photoURL: auth.currentUser.photoURL || "",
        streak: 0,
        lastActiveDate: today,
        todaySessions: 0,
        todayTaskSessions: 0,
        xp: 0,
        daily: { [today]: 0 },
        monthly: { [currentMonth]: 0 },
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
    const snap = await getDoc(docRef);
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

export const updateGamificationStats = async (
  mode: "Practice" | "Task" | "IELTS" = "Practice",
) => {
  if (!auth.currentUser) return null;
  
  const uid = auth.currentUser.uid;
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const docRef = doc(db, "userStats", uid);
  const isTaskOrIelts = mode === "Task" || mode === "IELTS";

  try {
    const snap = await getDoc(docRef);
    const isAnon = auth.currentUser.isAnonymous;
    const defaultName = auth.currentUser.displayName || (isAnon ? "Guest Scholar" : "Unknown Scholar");
    
    let stats: UserStats = {
      userId: uid,
      displayName: defaultName,
      photoURL: auth.currentUser.photoURL || "",
      streak: 1,
      lastActiveDate: today,
      todaySessions: 1,
      todayTaskSessions: isTaskOrIelts ? 1 : 0,
      xp: 50,
      daily: { [today]: 50 },
      monthly: { [currentMonth]: 50 },
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
      yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = existing.streak || 0;
      let newTodaySessions = existing.todaySessions || 0;
      let newTodayTaskSessions = existing.todayTaskSessions || 0;
      let newXp = existing.xp || 0;
      let newDaily = existing.daily || {};
      let newMonthly = existing.monthly || {};
      
      let xpGained = 0;

      if (lastDate === today) {
        newTodaySessions += 1;
        if (isTaskOrIelts) {
          newTodayTaskSessions += 1;
        }
        xpGained += 50; 
      } else if (lastDate === yesterdayStr) {
        newStreak += 1;
        newTodaySessions = 1;
        newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
        xpGained += 50;
      } else {
        newStreak = 1;
        newTodaySessions = 1;
        newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
        xpGained += 50;
      }

      if (lastDate === today) {
        if (newTodaySessions === 3) xpGained += 200;
        if (isTaskOrIelts && newTodayTaskSessions === 2) xpGained += 300;
      } else if (lastDate === yesterdayStr) {
        if (newStreak === 3) xpGained += 150;
        if (newStreak === 7) xpGained += 500;
      }

      newDaily[today] = (newDaily[today] || 0) + xpGained;
      newMonthly[currentMonth] = (newMonthly[currentMonth] || 0) + xpGained;

      stats = {
        userId: uid,
        displayName: (!isAnon && existing.displayName === "Guest Scholar") ? defaultName : (existing.displayName || defaultName),
        photoURL: auth.currentUser.photoURL || existing.photoURL || "",
        streak: newStreak,
        lastActiveDate: today,
        todaySessions: newTodaySessions,
        todayTaskSessions: newTodayTaskSessions,
        xp: newXp + xpGained,
        daily: newDaily,
        monthly: newMonthly,
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

export const getLeaderboard = async (
  period: "daily" | "monthly" | "allTime" = "allTime",
  limitCount: number = 10,
): Promise<UserStats[]> => {
  try {
    let q;
    const today = getLocalDateString();
    const currentMonth = getLocalMonthString();

    if (period === "daily") {
      q = query(
        collection(db, "userStats"),
        orderBy(`daily.${today}`, "desc"),
        limit(limitCount),
      );
    } else if (period === "monthly") {
      q = query(
        collection(db, "userStats"),
        orderBy(`monthly.${currentMonth}`, "desc"),
        limit(limitCount),
      );
    } else {
      q = query(
        collection(db, "userStats"),
        orderBy("xp", "desc"),
        limit(limitCount),
      );
    }
    
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data() as UserStats);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
};

export const saveReportToDb = async (
  context: BotContext,
  reportText: string,
  transcript?: string[],
  durationMs?: number,
) => {
  if (!auth.currentUser) return null;

  try {
    const docRef = await addDoc(collection(db, "reports"), {
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      level: context.level || "",
      mode: context.mode || "",
      topic: context.topic || context.objective || "",
      scenarioId: context.scenarioId || "",
      reportText: reportText || "",
      transcript: transcript || [],
      durationMs: durationMs || 0,
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Failed to save report:", error);
    return null;
  }
};

export const updateReportInDb = async (reportId: string, reportText: string) => {
  if (!auth.currentUser) return false;
  try {
    await setDoc(
      doc(db, "reports", reportId),
      {
        reportText: reportText,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error("Failed to update report:", error);
    return false;
  }
};

export interface SavedReport {
  id: string;
  createdAt: number;
  level: string;
  mode: string;
  topic: string;
  scenarioId?: string;
  reportText: string;
  transcript?: string[];
  durationMs?: number;
}

export const getUserReports = async (): Promise<SavedReport[]> => {
  if (!auth.currentUser) return [];

  try {
    const q = query(
      collection(db, "reports"),
      where("userId", "==", auth.currentUser.uid),
    );
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      const time = data.createdAt?.toMillis?.() || data.createdAt?.seconds * 1000 || Date.now();
      return {
        id: doc.id,
        ...data,
        createdAt: time,
      };
    }) as SavedReport[];
    reports.sort((a, b) => b.createdAt - a.createdAt);

    return reports;
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
};

export const deleteReportFromDb = async (reportId: string) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, "reports", reportId));
  } catch (error) {
    console.error("Failed to delete report:", error);
  }
};
