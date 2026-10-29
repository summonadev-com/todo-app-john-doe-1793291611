import { useMemo, useState } from 'react';
import { actions, addDays, currentSprintOf, iso, sprintStatus, useStore } from '@/lib/store';
import type { Sprint } from '@/types/pm';
import { Avatar, Card, Modal, PageHeader, StateBadge, TypeIcon, btnPrimary, btnSecondary, field, fmtDate } from '@/components/ui';
import { Burndown } from '@/components/Burndown';
import { useItemDialog } from '@/components/ItemDialog';

const statusStyle = { Current: 'bg-emerald-100 text-emerald-800', Upcoming: 'bg-blue-100 text-blue-800', Past: 'bg-slate-200 text-slate-600' } as const;

export function SprintsPage() {
  const s = useStore();
  const { openItem, newItem } = useItemDialog();
  const sprints = useMemo(
    () => s.sprints.filter((x) => x.projectId === s.currentProjectId).sort((a, b) => a.start.localeCompare(b.start)),
    [s.sprints, s.currentProjectId],
  );
  const [selId, setSelId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sprint | 'new' | null>(null);
  const sel = sprints.find((x) => x.id === selId) ?? currentSprintOf(sprints);
  const items = s.items.filter((i) => i.projectId === s.currentProjectId);
  const selItems = sel ? items.filter((i) => i.sprintId === sel.id) : [];
  const total = selItems.reduce((a, i) => a + i.points, 0);
  const done = selItems.filter((i) => i.state === 'Closed').reduce((a, i) => a + i.points, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Sprints" subtitle="Plan iterations, track progress and team capacity">
        <button className={btnPrimary} onClick={() => setEditing('new')}>
          + New sprint
        </button>
      </PageHeader>
      <div className="grid gap-5 p-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          {sprints.length === 0 && <p className="text-sm text-slate-500">No sprints yet. Create your first sprint.</p>}
          {sprints.map((sp) => {
            const st = sprintStatus(sp);
            const its = items.filter((i) => i.sprintId === sp.id);
            const t = its.reduce((a, i) => a + i.points, 0);
            const d = its.filter((i) => i.state === 'Closed').reduce((a, i) => a + i.points, 0);
            return (
              <button
                key={sp.id}
                onClick={() => setSelId(sp.id)}
                className={`w-full rounded border bg-white p-3 text-left shadow-sm hover:border-[#0078d4] ${sel?.id === sp.id ? 'border-[#0078d4] ring-1 ring-[#0078d4]' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{sp.name}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[st]}`}>{st}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {fmtDate(sp.start)} – {fmtDate(sp.end)}
                </div>
                <div className="mt-2 h-1.5 rounded bg-slate-100">
                  <div className="h-full rounded bg-[#0078d4]" style={{ width: `${t ? (d / t) * 100 : 0}%` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {d}/{t} pts · {its.length} items
                </div>
              </button>
            );
          })}
        </div>

        {sel && (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{sel.name}</h2>
                  <p className="text-sm text-slate-500">
                    {fmtDate(sel.start)} – {fmtDate(sel.end)} · {sel.goal || 'No goal set'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={btnSecondary} onClick={() => newItem({ sprintId: sel.id })}>
                    + Add item
                  </button>
                  <button className={btnSecondary} onClick={() => setEditing(sel)}>
                    Edit
                  </button>
                  <button
                    className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Delete ${sel.name}? Its work items move back to the backlog.`)) {
                        actions.deleteSprint(sel.id);
                        setSelId(null);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Progress</div>
                  <div className="text-2xl font-semibold">{pct}%</div>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Points done / planned</div>
                  <div className="text-2xl font-semibold">
                    {done} / {total}
                  </div>
                </div>
                <div className="rounded bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Work items</div>
                  <div className="text-2xl font-semibold">{selItems.length}</div>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Burndown">
                <Burndown sprint={sel} items={items} />
              </Card>
              <Card title="Capacity by team member">
                <ul className="space-y-3">
                  {s.members.map((m) => {
                    const pts = selItems.filter((i) => i.assigneeId === m.id).reduce((a, i) => a + i.points, 0);
                    const donePts = selItems.filter((i) => i.assigneeId === m.id && i.state === 'Closed').reduce((a, i) => a + i.points, 0);
                    return (
                      <li key={m.id} className="flex items-center gap-3 text-sm">
                        <Avatar member={m} />
                        <span className="w-28 truncate">{m.name}</span>
                        <div className="h-2 flex-1 rounded bg-slate-100">
                          <div className={`h-full rounded ${pts > 13 ? 'bg-red-500' : 'bg-[#0078d4]'}`} style={{ width: `${Math.min(100, (pts / 13) * 100)}%` }} />
                        </div>
                        <span className="w-16 text-right text-xs text-slate-500">
                          {donePts}/{pts} pts
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-slate-400">Capacity target: 13 points per person. Bars turn red when over capacity.</p>
              </Card>
            </div>

            <Card title="Sprint backlog">
              {selItems.length === 0 ? (
                <p className="text-sm text-slate-500">No work items in this sprint yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {selItems.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => openItem(i.id)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50">
                        <TypeIcon type={i.type} />
                        <span className="flex-1 truncate text-sm">{i.title}</span>
                        <StateBadge state={i.state} />
                        <Avatar member={s.members.find((m) => m.id === i.assigneeId)} size={22} />
                        <span className="w-10 text-right text-xs text-slate-500">{i.points} pts</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
      {editing && <SprintDialog sprint={editing === 'new' ? null : editing} projectId={s.currentProjectId} last={sprints[sprints.length - 1]} onClose={() => setEditing(null)} onCreated={setSelId} />}
    </div>
  );
}

function SprintDialog({
  sprint,
  projectId,
  last,
  onClose,
  onCreated,
}: {
  sprint: Sprint | null;
  projectId: string;
  last?: Sprint;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const defStart = last ? iso(addDays(new Date(last.end + 'T00:00'), 1)) : iso(new Date());
  const [name, setName] = useState(sprint?.name ?? `Sprint ${(last ? Number(last.name.replace(/\D/g, '')) || 0 : 0) + 1}`);
  const [start, setStart] = useState(sprint?.start ?? defStart);
  const [end, setEnd] = useState(sprint?.end ?? iso(addDays(new Date(defStart + 'T00:00'), 13)));
  const [goal, setGoal] = useState(sprint?.goal ?? '');
  const invalid = !name.trim() || !start || !end || end < start;
  return (
    <Modal title={sprint ? 'Edit sprint' : 'New sprint'} onClose={onClose}>
      <form
        className="space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (invalid) return;
          if (sprint) actions.updateSprint(sprint.id, { name: name.trim(), start, end, goal });
          else onCreated(actions.addSprint({ projectId, name: name.trim(), start, end, goal }));
          onClose();
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input autoFocus className={`${field} w-full`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start date</label>
            <input type="date" className={`${field} w-full`} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End date</label>
            <input type="date" className={`${field} w-full`} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {end < start && <p className="text-xs text-red-600">End date must be after the start date.</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Sprint goal</label>
          <textarea className={`${field} h-20 w-full`} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={invalid}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
