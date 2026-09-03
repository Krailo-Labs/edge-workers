export type ContentType = 'NOTE' | 'MATERIAL' | 'ARTICLE' | 'LESSON' | 'COURSE';
export type ContentState = 'DRAFT' | 'WORKING' | 'READY' | 'ARCHIVED';
export type Purpose = 'PERSONAL' | 'REFERENCE' | 'LEARNING' | 'PUBLISHING' | 'TEACHING' | 'PROJECT';
export type Visibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'image' | 'gif' | 'video' | 'table' | 'quote' | 'callout' | 'example' | 'code' | 'divider' | 'quiz' | 'interactive' | 'related-content' | 'ai-explanation';
  content: any;
}

export interface CourseModule {
  id: string;
  title: string;
  lessonIds: string[];
}

export interface ContentUnit {
  id: string;
  title: string;
  type: ContentType;
  state: ContentState;
  maturity: number;
  topicIds: string[];
  purpose: Purpose;
  visibility: Visibility;
  blocks: Block[];
  relations: string[];
  modules?: CourseModule[]; // Specific for courses
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Comment {
  id: string;
  contentId: string;
  blockId?: string;
  selectedText?: string;
  author: string;
  body: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  replies: Comment[];
  createdAt: string;
}

export type FeedbackCategory = 'BUG' | 'ENHANCEMENT' | 'ADDITION' | 'IDEA';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

export interface Feedback {
  id: string;
  category: FeedbackCategory;
  description: string;
  location: string;
  status: FeedbackStatus;
  createdAt: string;
}
