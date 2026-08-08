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
  lastActiveDate: string; // YYYY-MM-DD format
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

const GUEST_STATS_KEY = "guest_user_stats";

export const getGuestStats = (): UserStats => {
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const raw = typeof window !== "undefined" ? localStorage.getItem(GUEST_STATS_KEY) : null;
  if (raw) {
    try {
      const stats: UserStats = JSON.parse(raw);
      if (stats.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        stats.todaySessions = 0;
        stats.todayTaskSessions = 0;
        if (stats.lastActiveDate !== yesterdayStr) {
          stats.streak = 0;
        }
      }
      return stats;
    } catch (e) {
      console.error("Error parsing guest stats", e);
    }
  }

  const defaultStats: UserStats = {
    userId: "guest",
    displayName: "Guest Scholar",
    photoURL: "",
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
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(defaultStats));
  }
  return defaultStats;
};

export const updateGuestGamificationStats = (mode: "Practice" | "Task" | "IELTS" = "Practice"): UserStats => {
  const stats = getGuestStats();
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setMinutes(yesterday.getMinutes() - yesterday.getTimezoneOffset());
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let lastDate = stats.lastActiveDate;
  let newStreak = stats.streak || 0;
  let newTodaySessions = stats.todaySessions || 0;
  let newTodayTaskSessions = stats.todayTaskSessions || 0;
  let xpGained = 50;

  const isTaskOrIelts = mode === "Task" || mode === "IELTS";

  if (lastDate === today) {
    newTodaySessions += 1;
    if (isTaskOrIelts) {
      newTodayTaskSessions += 1;
    }
  } else if (lastDate === yesterdayStr) {
    newStreak += 1;
    newTodaySessions = 1;
    newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
  } else {
    newStreak = 1;
    newTodaySessions = 1;
    newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
  }

  if (lastDate === today) {
    if (newTodaySessions === 3) {
      xpGained += 200;
    }
    if (isTaskOrIelts && newTodayTaskSessions === 2) {
      xpGained += 300;
    }
  } else if (lastDate === yesterdayStr) {
    if (newStreak === 3) xpGained += 150;
    if (newStreak === 7) xpGained += 500;
  }

  stats.lastActiveDate = today;
  stats.streak = newStreak;
  stats.todaySessions = newTodaySessions;
  stats.todayTaskSessions = newTodayTaskSessions;
  stats.xp = (stats.xp || 0) + xpGained;
  stats.daily = stats.daily || {};
  stats.daily[today] = (stats.daily[today] || 0) + xpGained;
  stats.monthly = stats.monthly || {};
  stats.monthly[currentMonth] = (stats.monthly[currentMonth] || 0) + xpGained;
  stats.updatedAt = new Date().toISOString();

  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(stats));
  }
  return stats;
};

export const getUserStats = async (): Promise<UserStats | null> => {
  if (!auth.currentUser) return getGuestStats();
  try {
    const docRef = doc(db, "userStats", auth.currentUser.uid);
    const snap = await getDoc(docRef);
    const today = getLocalDateString();
    const currentMonth = getLocalMonthString();

    if (snap.exists()) {
      const data = snap.data() as UserStats;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setMinutes(
        yesterday.getMinutes() - yesterday.getTimezoneOffset(),
      );
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Migration for old docs & Daily Reset
      let needsUpdate = false;

      // If the last active date was not today, we might need to reset daily sessions or break streak
      if (data.lastActiveDate !== today) {
        // Reset daily limits ONLY if they haven't been reset yet (or if date is old)
        if (data.todaySessions !== 0 || data.todayTaskSessions !== 0) {
          data.todaySessions = 0;
          data.todayTaskSessions = 0;
          needsUpdate = true;
        }

        // Check if streak is broken (more than 1 day gap)
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
      if (
        !data.displayName ||
        data.displayName !== auth.currentUser.displayName
      ) {
        data.displayName = auth.currentUser.displayName || "Unknown Scholar";
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
      const defaultStats: UserStats = {
        userId: auth.currentUser.uid,
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
    return getGuestStats();
  }
};

export const updateUserPurchase = async (
  newXp: number,
  newUnlockedItems: string[],
  newBadge: string,
  newOutfit: string,
) => {
  if (!auth.currentUser) {
    const stats = getGuestStats();
    stats.xp = newXp;
    stats.unlockedItems = newUnlockedItems;
    stats.equippedBadge = newBadge;
    stats.equippedOutfit = newOutfit;
    stats.updatedAt = new Date().toISOString();
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(stats));
    }
    return stats;
  }
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

// Internal function to update user gamification stats
export const updateGamificationStats = async (
  mode: "Practice" | "Task" | "IELTS" = "Practice",
) => {
  if (!auth.currentUser) {
    return updateGuestGamificationStats(mode);
  }
  const uid = auth.currentUser.uid;
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const docRef = doc(db, "userStats", uid);
  const isTaskOrIelts = mode === "Task" || mode === "IELTS";

  try {
    const snap = await getDoc(docRef);
    let stats: UserStats = {
      userId: uid,
      displayName: auth.currentUser.displayName || "Unknown Scholar",
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
      yesterday.setMinutes(
        yesterday.getMinutes() - yesterday.getTimezoneOffset(),
      );
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = existing.streak || 0;
      let newTodaySessions = existing.todaySessions || 0;
      let newTodayTaskSessions = existing.todayTaskSessions || 0;
      let newXp = existing.xp || 0;
      let newDaily = existing.daily || {};
      let newMonthly = existing.monthly || {};
      
      let xpGained = 0;

      console.log(`Gamification Update - Last Active: ${lastDate}, Today: ${today}, Yesterday: ${yesterdayStr}`);

      if (lastDate === today) {
        console.log("Activity detected today. Incrementing daily counts.");
        newTodaySessions += 1;
        if (isTaskOrIelts) {
          newTodayTaskSessions += 1;
        }
        xpGained += 50; 
      } else if (lastDate === yesterdayStr) {
        console.log("Activity detected on consecutive day. Incrementing streak.");
        newStreak += 1;
        newTodaySessions = 1;
        newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
        xpGained += 50;
      } else {
        console.log("Streak broken or new user. Setting streak to 1.");
        newStreak = 1;
        newTodaySessions = 1;
        newTodayTaskSessions = isTaskOrIelts ? 1 : 0;
        xpGained += 50;
      }

      // Bonus XP for new sessions
      if (lastDate === today) {
        // Daily quest 1: 3 total conversations
        if (newTodaySessions === 3) {
          xpGained += 200; // Bonus 200 XP!
          console.log("Daily quest completed! +200 XP");
        }

        // Daily quest 2: 2 TBLT (Task) / IELTS conversations
        if (isTaskOrIelts && newTodayTaskSessions === 2) {
          xpGained += 300; // Bonus 300 XP
          console.log("Task quest completed! +300 XP");
        }
      } else if (lastDate === yesterdayStr) {
        // Streak milestones
        if (newStreak === 3) {
          xpGained += 150;
          console.log("Streak 3 days! +150 XP");
        }
        if (newStreak === 7) {
          xpGained += 500;
          console.log("Streak 7 days! +500 XP");
        }
      }

      newDaily[today] = (newDaily[today] || 0) + xpGained;
      newMonthly[currentMonth] = (newMonthly[currentMonth] || 0) + xpGained;

      stats = {
        userId: uid,
        displayName:
          auth.currentUser.displayName ||
          existing.displayName ||
          "Unknown Scholar",
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

// Fetch Top Users
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

// Save report or session session to database
export const saveReportToDb = async (
  context: BotContext,
  reportText: string,
  transcript?: string[],
) => {
  if (!auth.currentUser) return;

  try {
    const docRef = await addDoc(collection(db, "reports"), {
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      level: context.level || "",
      mode: context.mode || "",
      topic: context.topic || context.objective || "",
      reportText: reportText || "",
      transcript: transcript || [],
    });
    console.log("Report session saved successfully!");

    return docRef.id;
  } catch (error: any) {
    console.error("Failed to save report:", error);
    return null;
  }
};

// Update an existing report (usually adding reportText to a session that only had transcript)
export const updateReportInDb = async (reportId: string, reportText: string) => {
  if (!auth.currentUser) return;
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
  createdAt: { seconds: number; nanoseconds: number } | Date;
  level: string;
  mode: string;
  topic: string;
  scenarioId?: string;
  reportText: string;
  transcript?: string[];
  isLocal?: boolean;
  durationMs?: number;
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
