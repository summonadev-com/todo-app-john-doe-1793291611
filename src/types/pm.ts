export type ItemType = 'Epic' | 'Feature' | 'Story' | 'Task' | 'Bug';
export type ItemState = 'New' | 'Active' | 'Resolved' | 'Closed';

export const ITEM_TYPES: ItemType[] = ['Epic', 'Feature', 'Story', 'Task', 'Bug'];
export const ITEM_STATES: ItemState[] = ['New', 'Active', 'Resolved', 'Closed'];

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  start: string;
  end: string;
  goal: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  number: number;
  projectId: string;
  type: ItemType;
  title: string;
  description: string;
  state: ItemState;
  priority: 1 | 2 | 3 | 4;
  assigneeId: string | null;
  sprintId: string | null;
  points: number;
  dueDate: string;
  tags: string[];
  comments: Comment[];
  createdAt: string;
  closedAt: string | null;
}

export interface AppState {
  projects: Project[];
  members: Member[];
  sprints: Sprint[];
  items: WorkItem[];
  currentProjectId: string;
  currentUserId: string;
  nextNumber: number;
}
