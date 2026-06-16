import { create } from 'zustand';
import { createActivity, fetchActivities, fetchActivitySummary, ActivityPayload } from '../api/activity';
import { ActivityCategory } from '../constants/activity';
import { Activity } from '../types/entities';

interface ActivityStore {
  rows: Activity[];
  total: number;
  byCategory: { category: ActivityCategory; value: number }[];
  loading: boolean;
  lastLoadType: 'list' | 'summary' | null;
  lastFilters: { category?: ActivityCategory; start?: string; end?: string } | null;
  lastRange: { start: string; end: string } | null;
  load: (filters?: { category?: ActivityCategory; start?: string; end?: string }) => Promise<void>;
  loadSummary: (range: { start: string; end: string }) => Promise<void>;
  add: (payload: ActivityPayload) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  rows: [],
  total: 0,
  byCategory: [],
  loading: false,
  lastLoadType: null,
  lastFilters: null,
  lastRange: null,
  async load(filters) {
    set({ loading: true, lastLoadType: 'list', lastFilters: filters || null });
    const rows = await fetchActivities(filters);
    set({ rows, loading: false });
  },
  async loadSummary(range) {
    set({ lastLoadType: 'summary', lastRange: range });
    const summary = await fetchActivitySummary(range);
    set({ total: summary.total, byCategory: summary.byCategory, rows: summary.rows });
  },
  async add(payload) {
    await createActivity(payload);
    await get().load();
  },
  async refresh() {
    const { lastLoadType, lastFilters, lastRange } = get();
    if (lastLoadType === 'summary' && lastRange) {
      await get().loadSummary(lastRange);
    } else if (lastLoadType === 'list') {
      await get().load(lastFilters || undefined);
    }
  }
}));

