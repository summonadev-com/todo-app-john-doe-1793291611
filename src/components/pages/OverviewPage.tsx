import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { currentSprintOf, todayIso, useStore } from '@/lib/store';
import { ITEM_STATES, ITEM_TYPES } from '@/types/pm';
import { Avatar, Card, PageHeader, PriorityBadge, STATE_COLOR, StateBadge, TYPE_COLOR, TypeIcon, btnPrimary, fmtDate } from '@/components/ui';
import { Burndown } from '@/components/Burndown';
import { useItemDialog } from '@/components/ItemDialog';

export function OverviewPage() {
  const s = useStore();
  const { openItem, newItem } = useItemDialog();
  const project = s.projects.find((p) => p.id === s.currentProjectId);
  const items = useMemo(() => s.items.filter((i) => i.projectId === s.currentProjectId), [s.items, s.currentProjectId]);
  const sprints = useMemo(() => s.sprints.filter((x) => x.projectId === s.currentProjectId), [s.sprints, s.currentProjectId]);
  const sprint = currentSprintOf(sprints);
  const today = todayIso();

  const open = items.filter((i) => i.state !== 'Closed');
  const overdue = open.filter((i) => i.dueDate && i.dueDate < today);
  const activeBugs = items.filter((i) => i.type === 'Bug' && i.state !== 'Closed');
  const totalPts = items.reduce((a, i) => a + i.points, 0);
  const donePts = items.filter((i) => i.state === 'Closed').reduce((a, i) => a + i.points, 0);
  const myItems = open.filter((i) => i.assigneeId === s.currentUserId);
  const maxState = Math.max(1, ...ITEM_STATES.map((st) => items.filter((i) => i.state === st).length));
  const maxType = Math.max(1, ...ITEM_TYPES.map((t) => items.filter((i) => i.type === t).length));

  const stats = [
    { label: 'Open work items', value: open.length, color: 'text-[#0078d4]' },
    { label: 'Overdue', value: overdue.length, color: overdue.length ? 'text-red-600' : 'text-slate-800' },
    { label: 'Active bugs', value: activeBugs.length, color: activeBugs.length ? 'text-red-600' : 'text-slate-800' },
    { label: 'Points completed', value: `${donePts} / ${totalPts}`, color: 'text-emerald-600' },
  ];

  return (
    <div>
      <PageHeader title={project?.name ?? 'Overview'} subtitle={project?.description}>
        <button className={btnPrimary} onClick={() => newItem()}>
          + New work item
        </button>
      </PageHeader>
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((st) => (
            <Card key={st.label}>
              <div className="text-sm text-slate-500">{st.label}</div>
              <div className={`mt-1 text-3xl font-semibold ${st.color}`}>{st.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card title={sprint ? `${sprint.name} burndown (${fmtDate(sprint.start)} – ${fmtDate(sprint.end)})` : 'Sprint burndown'} className="lg:col-span-2">
            {sprint ? (
              <>
                {sprint.goal && <p className="mb-2 text-sm text-slate-500">Goal: {sprint.goal}</p>}
                <Burndown sprint={sprint} items={items} />
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No sprints yet. <Link to="/sprints" className="text-[#0078d4] hover:underline">Plan your first sprint</Link>.
              </p>
            )}
          </Card>
          <Card title="Work items by state">
            <div className="space-y-3">
              {ITEM_STATES.map((st) => {
                const c = items.filter((i) => i.state === st).length;
                return (
                  <div key={st}>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>{st}</span>
                      <span>{c}</span>
                    </div>
                    <div className="h-2.5 rounded bg-slate-100">
                      <div className="h-full rounded" style={{ width: `${(c / maxState) * 100}%`, background: STATE_COLOR[st] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card title="Assigned to me" className="lg:col-span-2">
            {myItems.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing assigned to you. Nice work!</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myItems.slice(0, 8).map((i) => (
                  <li key={i.id}>
                    <button onClick={() => openItem(i.id)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50">
                      <TypeIcon type={i.type} />
                      <span className="min-w-0 flex-1 truncate text-sm">{i.title}</span>
                      <PriorityBadge priority={i.priority} />
                      <StateBadge state={i.state} />
                      <span className={`w-14 text-right text-xs ${i.dueDate && i.dueDate < today ? 'text-red-600' : 'text-slate-500'}`}>{fmtDate(i.dueDate)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Team workload (open items)">
            <ul className="space-y-2.5">
              {s.members.map((m) => {
                const c = open.filter((i) => i.assigneeId === m.id).length;
                return (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <Avatar member={m} />
                    <span className="flex-1 truncate">{m.name}</span>
                    <span className="text-slate-500">{c}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card title="Work items by type">
          <div className="grid gap-4 sm:grid-cols-5">
            {ITEM_TYPES.map((t) => {
              const c = items.filter((i) => i.type === t).length;
              return (
                <div key={t} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end rounded bg-slate-50">
                    <div className="w-full rounded-t" style={{ height: `${(c / maxType) * 100}%`, background: TYPE_COLOR[t] }} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <TypeIcon type={t} size={16} /> {t}s <b>{c}</b>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
