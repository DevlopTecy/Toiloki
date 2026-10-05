/**
 * SessionStore — Global Multi-Tab Workbench Session Management
 * Keyed by tabId and workspaceId.
 * Persists files, version stacks, options, page ranges, editor contents,
 * and calculator history. Navigating across Home, tabs, or settings preserves state.
 */

export interface SerializedFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  previewUrl?: string;
  bufferBase64?: string;
  path?: string;
}

export interface TabSession {
  tabId: string;
  workspaceId: string;
  groupId?: string;
  utilityId?: string;
  featureId?: string;
  files: SerializedFile[];
  versionStack: Array<{
    id: string;
    name: string;
    timestamp: number;
    size?: number;
  }>;
  versionIndex: number;
  options: Record<string, any>;
  pageSelections?: Record<string, string>;
  scrollPosition?: { x: number; y: number };
  editorContent?: string;
  calculatorHistory?: string[];
  updatedAt: number;
}

export interface ResumeSessionItem {
  id: string;
  tabId: string;
  workspaceId: string;
  groupId?: string;
  utilityId?: string;
  title: string;
  summary: string;
  fileCount: number;
  timestamp: number;
}

const STORAGE_KEY = 'toiloki_active_sessions';
const RESUME_KEY = 'toiloki_resume_sessions';

class SessionStoreImpl {
  private sessions: Map<string, TabSession> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private makeKey(tabId: string, workspaceId?: string): string {
    return workspaceId ? `${tabId}:${workspaceId}` : tabId;
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [k, v] of Object.entries(parsed)) {
            this.sessions.set(k, v as TabSession);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load session store from storage', e);
    }
  }

  private persist() {
    try {
      const obj: Record<string, TabSession> = {};
      const resumeList: ResumeSessionItem[] = [];

      for (const [k, v] of this.sessions.entries()) {
        obj[k] = v;
        if (v.files && v.files.length > 0) {
          resumeList.push({
            id: k,
            tabId: v.tabId,
            workspaceId: v.workspaceId,
            groupId: v.groupId,
            utilityId: v.utilityId,
            title: v.files[0]?.name || v.workspaceId,
            summary: `${v.files.length} ${v.files.length === 1 ? 'file' : 'files'} in ${v.workspaceId}`,
            fileCount: v.files.length,
            timestamp: v.updatedAt,
          });
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      if (resumeList.length > 0) {
        localStorage.setItem(RESUME_KEY, JSON.stringify(resumeList));
      } else {
        localStorage.removeItem(RESUME_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist session store', e);
    }
    this.notify();
  }

  public getSession(tabId: string, workspaceId?: string): TabSession | undefined {
    const key = this.makeKey(tabId, workspaceId);
    let session = this.sessions.get(key);
    if (!session && !workspaceId) {
      // Find any session starting with tabId
      for (const [k, v] of this.sessions.entries()) {
        if (k.startsWith(`${tabId}:`) || k === tabId) {
          return v;
        }
      }
    }
    return session;
  }

  public saveSession(
    tabId: string,
    workspaceId: string,
    data: Partial<TabSession>
  ): void {
    const key = this.makeKey(tabId, workspaceId);
    const existing = this.sessions.get(key) || {
      tabId,
      workspaceId,
      files: [],
      versionStack: [],
      versionIndex: -1,
      options: {},
      updatedAt: Date.now(),
    };

    const updated: TabSession = {
      ...existing,
      ...data,
      tabId,
      workspaceId,
      updatedAt: Date.now(),
    };

    this.sessions.set(key, updated);
    this.persist();

    // Broadcast update
    window.dispatchEvent(
      new CustomEvent('toiloki-session-updated', {
        detail: { tabId, workspaceId, hasFiles: updated.files.length > 0 },
      })
    );
  }

  public clearSession(tabId: string, workspaceId?: string): void {
    if (workspaceId) {
      const key = this.makeKey(tabId, workspaceId);
      this.sessions.delete(key);
    } else {
      // Delete all sessions for this tabId
      const toDelete: string[] = [];
      for (const k of this.sessions.keys()) {
        if (k === tabId || k.startsWith(`${tabId}:`)) {
          toDelete.push(k);
        }
      }
      for (const k of toDelete) {
        this.sessions.delete(k);
      }
    }
    this.persist();

    window.dispatchEvent(
      new CustomEvent('toiloki-session-updated', {
        detail: { tabId, workspaceId, hasFiles: false },
      })
    );
  }

  public clearAllSessions(): void {
    this.sessions.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESUME_KEY);
    this.persist();
  }

  public hasUnsavedWork(tabId: string): boolean {
    for (const [k, v] of this.sessions.entries()) {
      if (k === tabId || k.startsWith(`${tabId}:`)) {
        if ((v.files && v.files.length > 0) || (v.versionStack && v.versionStack.length > 1)) {
          return true;
        }
      }
    }
    return false;
  }

  public getResumeableSessions(): ResumeSessionItem[] {
    try {
      const raw = localStorage.getItem(RESUME_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  public clearResumeableSessions(): void {
    localStorage.removeItem(RESUME_KEY);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('SessionStore listener error:', e);
      }
    }
  }
}

export const SessionStore = new SessionStoreImpl();
