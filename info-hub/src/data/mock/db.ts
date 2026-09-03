import { create } from 'zustand';
import { ContentUnit, Topic, Comment, Feedback, ContentType } from '@/shared/types';
import { demoContent, demoTopics, demoComments, demoFeedback } from './demo-data';

const STORAGE_KEY_CONTENT = 'infohub_data_content';
const STORAGE_KEY_TOPICS = 'infohub_data_topics';
const STORAGE_KEY_COMMENTS = 'infohub_data_comments';
const STORAGE_KEY_FEEDBACK = 'infohub_data_feedback';

// Helper to deeply sanitize data and strip any cyclic references / unwanted properties
export function sanitizeData<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    console.error('Data sanitization fallback applied:', err);
    return obj;
  }
}

const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
};

const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    const clean = sanitizeData(data);
    localStorage.setItem(key, JSON.stringify(clean));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
};

interface DatabaseState {
  content: ContentUnit[];
  topics: Topic[];
  comments: Comment[];
  feedback: Feedback[];
  isCloudflareConnected: boolean;
  
  // Actions
  initializeFromStorage: () => void;
  addContent: (unit: ContentUnit) => void;
  updateContent: (id: string, data: Partial<ContentUnit>) => void;
  deleteContent: (id: string) => void;
  
  addComment: (comment: Comment) => void;
  updateCommentStatus: (id: string, status: Comment['status']) => void;
  
  addFeedback: (fb: Feedback) => void;
  updateFeedbackStatus: (id: string, status: Feedback['status']) => void;
  updateFeedback: (id: string, data: Partial<Feedback>) => void;
  deleteFeedback: (id: string) => void;
  
  importContent: (units: ContentUnit[]) => void;
  resetToDefaults: () => void;
  setCloudflareConnected: (connected: boolean) => void;
}

export const useMockDb = create<DatabaseState>((set, get) => ({
  content: demoContent,
  topics: demoTopics,
  comments: demoComments,
  feedback: demoFeedback,
  isCloudflareConnected: false,
  
  initializeFromStorage: () => {
    if (typeof window === 'undefined') return;
    set({
      content: loadFromStorage<ContentUnit[]>(STORAGE_KEY_CONTENT, demoContent),
      topics: loadFromStorage<Topic[]>(STORAGE_KEY_TOPICS, demoTopics),
      comments: loadFromStorage<Comment[]>(STORAGE_KEY_COMMENTS, demoComments),
      feedback: loadFromStorage<Feedback[]>(STORAGE_KEY_FEEDBACK, demoFeedback),
    });
  },
  
  addContent: (unit) => {
    const cleanUnit = sanitizeData(unit);
    set((state) => {
      const next = [cleanUnit, ...state.content];
      saveToStorage(STORAGE_KEY_CONTENT, next);
      return { content: next };
    });
  },
  
  updateContent: (id, data) => {
    const cleanData = sanitizeData(data);
    set((state) => {
      const next = state.content.map(c => 
        c.id === id ? { ...c, ...cleanData, updatedAt: new Date().toISOString() } : c
      );
      saveToStorage(STORAGE_KEY_CONTENT, next);
      return { content: next };
    });
  },
  
  deleteContent: (id) => {
    set((state) => {
      const next = state.content.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEY_CONTENT, next);
      return { content: next };
    });
  },
  
  addComment: (comment) => {
    const cleanComment = sanitizeData(comment);
    set((state) => {
      const next = [cleanComment, ...state.comments];
      saveToStorage(STORAGE_KEY_COMMENTS, next);
      return { comments: next };
    });
  },
  
  updateCommentStatus: (id, status) => {
    set((state) => {
      const next = state.comments.map(c => c.id === id ? { ...c, status } : c);
      saveToStorage(STORAGE_KEY_COMMENTS, next);
      return { comments: next };
    });
  },
  
  addFeedback: (fb) => {
    const cleanFb = sanitizeData(fb);
    set((state) => {
      const next = [cleanFb, ...state.feedback];
      saveToStorage(STORAGE_KEY_FEEDBACK, next);
      return { feedback: next };
    });
  },
  
  updateFeedbackStatus: (id, status) => {
    set((state) => {
      const next = state.feedback.map(f => f.id === id ? { ...f, status } : f);
      saveToStorage(STORAGE_KEY_FEEDBACK, next);
      return { feedback: next };
    });
  },

  updateFeedback: (id, data) => {
    const cleanData = sanitizeData(data);
    set((state) => {
      const next = state.feedback.map(f => f.id === id ? { ...f, ...cleanData } : f);
      saveToStorage(STORAGE_KEY_FEEDBACK, next);
      return { feedback: next };
    });
  },

  deleteFeedback: (id) => {
    set((state) => {
      const next = state.feedback.filter(f => f.id !== id);
      saveToStorage(STORAGE_KEY_FEEDBACK, next);
      return { feedback: next };
    });
  },
  
  importContent: (units) => {
    const cleanUnits = sanitizeData(units);
    set((state) => {
      const next = [...cleanUnits, ...state.content];
      saveToStorage(STORAGE_KEY_CONTENT, next);
      return { content: next };
    });
  },

  resetToDefaults: () => {
    set({
      content: demoContent,
      topics: demoTopics,
      comments: demoComments,
      feedback: demoFeedback,
    });
    saveToStorage(STORAGE_KEY_CONTENT, demoContent);
    saveToStorage(STORAGE_KEY_TOPICS, demoTopics);
    saveToStorage(STORAGE_KEY_COMMENTS, demoComments);
    saveToStorage(STORAGE_KEY_FEEDBACK, demoFeedback);
  },

  setCloudflareConnected: (connected) => set({ isCloudflareConnected: connected })
}));

// Feature Services Wrappers (Domain Repositories)
export const useContentRepo = () => {
  const db = useMockDb();
  return {
    getAll: () => db.content,
    getById: (id: string) => db.content.find(c => c.id === id),
    getByType: (type: ContentType) => db.content.filter(c => c.type === type),
    add: db.addContent,
    update: db.updateContent,
    remove: db.deleteContent,
    import: db.importContent,
    reset: db.resetToDefaults
  };
};

export const useTopicRepo = () => {
  const db = useMockDb();
  return {
    getAll: () => db.topics,
    getById: (id: string) => db.topics.find(t => t.id === id),
  };
};

export const useCommentRepo = () => {
  const db = useMockDb();
  return {
    getByContentId: (id: string) => db.comments.filter(c => c.contentId === id),
    add: db.addComment,
    updateStatus: db.updateCommentStatus
  };
};

export const useFeedbackRepo = () => {
  const db = useMockDb();
  return {
    getAll: () => db.feedback,
    add: db.addFeedback,
    updateStatus: db.updateFeedbackStatus,
    update: db.updateFeedback,
    remove: db.deleteFeedback,
  };
};
