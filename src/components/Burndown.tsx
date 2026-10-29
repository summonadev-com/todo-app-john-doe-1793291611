import type { Sprint, WorkItem } from '@/types/pm';
import { addDays, iso, todayIso } from '@/lib/store';

export function Burndown({ sprint, items }: { sprint: Sprint; items: WorkItem[] }) {
  const sprintItems = items.filter((i) => i.sprintId === sprint.id);
  const total = sprintItems.reduce((a, i) => a + i.points, 0);
  const start = new Date(sprint.start + 'T00:00');
  const end = new Date(sprint.end + 'T00:00');
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const today = todayIso();
  const W = 600;
  const H = 200;
  const pad = 28;
  const x = (i: number) => pad + (i / days) * (W - pad * 2);
  const y = (v: number) => H - pad - (total === 0 ? 0 : (v / total) * (H - pad * 2));

  const ideal: string[] = [];
  const actual: string[] = [];
  for (let i = 0; i <= days; i++) {
    const day = iso(addDays(start, i));
    ideal.push(`${x(i)},${y(total * (1 - i / days))}`);
    if (day <= today) {
      const closed = sprintItems.filter((it) => it.closedAt && it.closedAt <= day).reduce((a, it) => a + it.points, 0);
      actual.push(`${x(i)},${y(total - closed)}`);
    }
  }
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#cbd5e1" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#cbd5e1" />
        <text x={4} y={pad + 4} fontSize="10" fill="#64748b">
          {total}
        </text>
        <text x={10} y={H - pad + 4} fontSize="10" fill="#64748b">
          0
        </text>
        <polyline points={ideal.join(' ')} fill="none" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="2" />
        {actual.length > 1 && <polyline points={actual.join(' ')} fill="none" stroke="#0078d4" strokeWidth="2.5" />}
      </svg>
      <div className="flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-[#0078d4]" /> Remaining points
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-slate-400" /> Ideal trend
        </span>
      </div>
    </div>
  );
}
