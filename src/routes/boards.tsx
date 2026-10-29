import { createFileRoute } from '@tanstack/react-router';
import { BoardsPage } from '@/components/pages/BoardsPage';

export const Route = createFileRoute('/boards')({
  component: BoardsPage,
});
