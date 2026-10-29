import { createFileRoute } from '@tanstack/react-router';
import { OverviewPage } from '@/components/pages/OverviewPage';

export const Route = createFileRoute('/')({
  component: OverviewPage,
});
