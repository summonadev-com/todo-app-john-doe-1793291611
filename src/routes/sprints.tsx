import { createFileRoute } from '@tanstack/react-router';
import { SprintsPage } from '@/components/pages/SprintsPage';

export const Route = createFileRoute('/sprints')({
  component: SprintsPage,
});
