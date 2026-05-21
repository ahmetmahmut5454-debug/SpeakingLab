import { openDB, DBSchema, IDBPDatabase } from "idb";
import { SavedReport } from "./firebase";

export interface LocalReport extends SavedReport {
  synced?: boolean;
  createdAtTime: number; // For sorting
}

interface EltDbSchema extends DBSchema {
  reports: {
    key: string;
    value: LocalReport;
    indexes: {
      "by-date": number;
      "by-sync": number;
      "by-synced": string; // boolean is not indexable, use "true"/"false" if needed, but not strictly necessary for our queries.
    };
  };
}

const DB_NAME = "elt-speaking-buddy-db";
const STORE_NAME = "reports";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EltDbSchema>>;

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<EltDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("reports")) {
          const store = db.createObjectStore("reports", { keyPath: "id" });
          store.createIndex("by-date", "createdAtTime");
        }
      },
    });
  }
  return dbPromise;
};

export const saveLocalReport = async (report: Omit<LocalReport, "synced">) => {
  const db = await getDb();
  const localReport: LocalReport = {
    ...report,
    synced: false,
  };
  await db.put(STORE_NAME, localReport);
  return localReport;
};

export const updateLocalReportText = async (id: string, text: string) => {
  const db = await getDb();
  const report = await db.get(STORE_NAME, id);
  if (report) {
    report.reportText = text;
    report.synced = false; // Need to re-sync
    await db.put(STORE_NAME, report);
    return report;
  }
  return null;
};

export const getLocalReports = async (): Promise<LocalReport[]> => {
  const db = await getDb();
  const reports = await db.getAllFromIndex(STORE_NAME, "by-date");
  // getAllFromIndex returns in ascending order, we usually want descending
  return reports.reverse();
};

export const deleteLocalReport = async (id: string) => {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
};

export const markReportAsSynced = async (id: string, syncedId?: string) => {
    const db = await getDb();
    const report = await db.get(STORE_NAME, id);
    if (report) {
      report.synced = true;
      if (syncedId) {
          // If we want to replace the local ID with the Cloud ID?
          // Actually, it's safer to just track by original ID or keep a mapping.
          // To keep it simple, we just mark it synced.
      }
      await db.put(STORE_NAME, report);
    }
}
