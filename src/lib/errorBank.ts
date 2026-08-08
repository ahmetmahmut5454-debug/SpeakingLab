export interface ErrorBankItem {
  id: string;
  original: string;
  correction: string;
  category?: 'Grammar' | 'Vocabulary' | 'Pronunciation';
  timestamp: number;
  reviewCount: number;
  mastered: boolean;
}

const STORAGE_KEY = 'elt_error_bank_v1';

export const getErrorBank = (): ErrorBankItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse error bank:', e);
    return [];
  }
};

export const saveErrorBank = (items: ErrorBankItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save error bank:', e);
  }
};

export const addErrorItemsFromReport = (reportText: string) => {
  if (!reportText) return;
  const currentBank = getErrorBank();

  // Regex to extract "Mistake" -> "Correction" or "Original" -> "Suggested"
  const correctionRegex = /["'`](.*?)["'`]\s*->\s*["'`](.*?)["'`]/g;
  let match;
  let addedCount = 0;

  while ((match = correctionRegex.exec(reportText)) !== null) {
    const original = match[1].trim();
    const correction = match[2].trim();

    if (original && correction && original.toLowerCase() !== correction.toLowerCase()) {
      // Check if already exists
      const exists = currentBank.some(
        (item) => item.original.toLowerCase() === original.toLowerCase()
      );
      if (!exists) {
        currentBank.unshift({
          id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          original,
          correction,
          category: 'Grammar',
          timestamp: Date.now(),
          reviewCount: 0,
          mastered: false,
        });
        addedCount++;
      }
    }
  }

  if (addedCount > 0) {
    // Limit total active errors in bank to 50
    const trimmed = currentBank.slice(0, 50);
    saveErrorBank(trimmed);
  }
};

export const markErrorMastered = (id: string, mastered = true) => {
  const bank = getErrorBank();
  const updated = bank.map((item) =>
    item.id === id ? { ...item, mastered, reviewCount: item.reviewCount + 1 } : item
  );
  saveErrorBank(updated);
};

export const getUnmasteredErrorsForPrompt = (): string[] => {
  const bank = getErrorBank().filter((item) => !item.mastered);
  return bank.slice(0, 5).map((item) => `"${item.original}" -> "${item.correction}"`);
};
