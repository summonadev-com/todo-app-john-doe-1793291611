import { createFileRoute } from '@tanstack/react-router';
import { TodoApp } from '@/components/TodoApp';

export const Route = createFileRoute('/')({
  component: TodoApp,
});
