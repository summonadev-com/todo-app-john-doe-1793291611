export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  title: string;
  priority: Priority;
  category: string;
  dueDate: string;
  done: boolean;
}
