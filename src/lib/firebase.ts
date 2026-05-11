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
  displayName?: string;
  photoURL?: string;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD format
  todaySessions: number;
  todayTaskSessions?: number;
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
    const today = getLocalDateString();

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

        // Note: We deliberately DON'T update lastActiveDate to today here.
        // It's updated only in updateGamificationStats when a session is completed.
        // This avoids breaking the streak increment logic.
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
        lastActiveDate: getLocalDateString(),
        todaySessions: 0,
        todayTaskSessions: 0,
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
export const updateGamificationStats = async (
  mode: "Practice" | "Task" = "Practice",
) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const today = getLocalDateString();
  const docRef = doc(db, "userStats", uid);

  try {
    const snap = await getDocFromServer(docRef);
    let stats: UserStats = {
      userId: uid,
      displayName: auth.currentUser.displayName || "Unknown Scholar",
      photoURL: auth.currentUser.photoURL || "",
      streak: 1,
      lastActiveDate: today,
      todaySessions: 1,
      todayTaskSessions: mode === "Task" ? 1 : 0,
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

      let newStreak = existing.streak || 0;
      let newTodaySessions = existing.todaySessions || 0;
      let newTodayTaskSessions = existing.todayTaskSessions || 0;
      let newXp = existing.xp || 0;

      console.log(`Gamification Update - Last Active: ${lastDate}, Today: ${today}, Yesterday: ${yesterdayStr}`);

      if (lastDate === today) {
        console.log("Activity detected today. Incrementing daily counts.");
        newTodaySessions += 1;
        if (mode === "Task") {
          newTodayTaskSessions += 1;
        }
        newXp += 50; 
      } else if (lastDate === yesterdayStr) {
        console.log("Activity detected on consecutive day. Incrementing streak.");
        newStreak += 1;
        newTodaySessions = 1;
        newTodayTaskSessions = mode === "Task" ? 1 : 0;
        newXp += 50;
      } else {
        console.log("Streak broken or new user. Setting streak to 1.");
        newStreak = 1;
        newTodaySessions = 1;
        newTodayTaskSessions = mode === "Task" ? 1 : 0;
        newXp += 50;
      }

      // Bonus XP for new sessions
      if (lastDate === today) {
        // Daily quest 1: 3 total conversations
        if (newTodaySessions === 3) {
          newXp += 200; // Bonus 200 XP!
          console.log("Daily quest completed! +200 XP");
        }

        // Daily quest 2: 2 TBLT (Task) conversations
        if (mode === "Task" && newTodayTaskSessions === 2) {
          newXp += 300; // Bonus 300 XP
          console.log("Task quest completed! +300 XP");
        }
      } else if (lastDate === yesterdayStr) {
        // Streak milestones
        if (newStreak === 3) {
          newXp += 150;
          console.log("Streak 3 days! +150 XP");
        }
        if (newStreak === 7) {
          newXp += 500;
          console.log("Streak 7 days! +500 XP");
        }
      }

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

// Fetch Top Users
export const getLeaderboard = async (
  limitCount: number = 10,
): Promise<UserStats[]> => {
  try {
    const q = query(
      collection(db, "userStats"),
      orderBy("xp", "desc"),
      limit(limitCount), // Note: using 100 limit here locally in our codebase we can do more but 10 is standard
    );
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
  reportText: string;
  transcript?: string[];
  isLocal?: boolean;
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
