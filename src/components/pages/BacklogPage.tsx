import { useMemo, useState } from 'react';
import { actions, todayIso, useStore } from '@/lib/store';
import { ITEM_STATES, ITEM_TYPES } from '@/types/pm';
import type { ItemState, ItemType, WorkItem } from '@/types/pm';
import { Avatar, PageHeader, PriorityBadge, StateBadge, TypeIcon, btnPrimary, btnSecondary, field, fmtDate } from '@/components/ui';
import { useItemDialog } from '@/components/ItemDialog';

type SortKey = 'number' | 'title' | 'state' | 'priority' | 'points' | 'dueDate';

export function BacklogPage() {
  const s = useStore();
  const { openItem, newItem } = useItemDialog();
  const project = s.projects.find((p) => p.id === s.currentProjectId);
  const sprints = useMemo(() => s.sprints.filter((x) => x.projectId === s.currentProjectId), [s.sprints, s.currentProjectId]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | ItemType>('all');
  const [state, setState] = useState<'all' | 'open' | ItemState>('open');
  const [assignee, setAssignee] = useState('all');
  const [sprint, setSprint] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'priority', dir: 1 });
  const [selected, setSelected] = useState<string[]>([]);
  const today = todayIso();

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const list = s.items.filter(
      (i) =>
        i.projectId === s.currentProjectId &&
        (i.title.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q)) || String(i.number) === q) &&
        (type === 'all' || i.type === type) &&
        (state === 'all' || (state === 'open' ? i.state !== 'Closed' : i.state === state)) &&
        (assignee === 'all' || (assignee === 'none' ? !i.assigneeId : i.assigneeId === assignee)) &&
        (sprint === 'all' || (sprint === 'none' ? !i.sprintId : i.sprintId === sprint)),
    );
    const val = (i: WorkItem): string | number => i[sort.key];
    return list.sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (sort.key === 'dueDate') {
        if (!av && bv) return 1;
        if (av && !bv) return -1;
      }
      const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return c * sort.dir;
    });
  }, [s.items, s.currentProjectId, search, type, state, assignee, sprint, sort]);

  function toggleSort(key: SortKey) {
    setSort((p) => (p.key === key ? { key, dir: p.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }
  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['ID', 'Type', 'Title', 'State', 'Priority', 'Assignee', 'Sprint', 'Points', 'Due', 'Tags'];
    const lines = rows.map((i) =>
      [
        `${project?.key}-${i.number}`,
        i.type,
        i.title,
        i.state,
        i.priority,
        s.members.find((m) => m.id === i.assigneeId)?.name ?? '',
        sprints.find((x) => x.id === i.sprintId)?.name ?? 'Backlog',
        i.points,
        i.dueDate,
        i.tags.join(';'),
      ]
        .map(esc)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project?.key ?? 'backlog'}-work-items.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function bulk(patch: Partial<WorkItem>) {
    selected.forEach((id) => actions.updateItem(id, patch));
    setSelected([]);
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const th = (label: string, key?: SortKey) => (
    <th
      onClick={key ? () => toggleSort(key) : undefined}
      className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${key ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
    >
      {label} {key && sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div>
      <PageHeader title="Backlog" subtitle={`${project?.name} · ${rows.length} work items`}>
        <button className={btnSecondary} onClick={exportCsv}>
          Export CSV
        </button>
        <button className={btnPrimary} onClick={() => newItem()}>
          + New work item
        </button>
      </PageHeader>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <input className={`${field} w-56`} placeholder="Search title, tag or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={field} value={type} onChange={(e) => setType(e.target.value as 'all' | ItemType)}>
          <option value="all">All types</option>
          {ITEM_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={field} value={state} onChange={(e) => setState(e.target.value as 'all' | 'open' | ItemState)}>
          <option value="open">Open (not closed)</option>
          <option value="all">All states</option>
          {ITEM_STATES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={field} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="all">Anyone</option>
          <option value="none">Unassigned</option>
          {s.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select className={field} value={sprint} onChange={(e) => setSprint(e.target.value)}>
          <option value="all">Any sprint</option>
          <option value="none">Backlog only</option>
          {sprints.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-blue-50 px-6 py-2 text-sm">
          <b>{selected.length} selected</b>
          <select className={field} defaultValue="" onChange={(e) => e.target.value && bulk({ state: e.target.value as ItemState })}>
            <option value="">Set state…</option>
            {ITEM_STATES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select className={field} defaultValue="" onChange={(e) => e.target.value && bulk({ assigneeId: e.target.value === 'none' ? null : e.target.value })}>
            <option value="">Assign to…</option>
            <option value="none">Unassigned</option>
            {s.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className={field} defaultValue="" onChange={(e) => e.target.value && bulk({ sprintId: e.target.value === 'none' ? null : e.target.value })}>
            <option value="">Move to sprint…</option>
            <option value="none">Backlog</option>
            {sprints.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <button
            className="text-red-600 hover:underline"
            onClick={() => {
              if (confirm(`Delete ${selected.length} work items?`)) {
                selected.forEach((id) => actions.deleteItem(id));
                setSelected([]);
              }
            }}
          >
            Delete
          </button>
          <button className="ml-auto text-slate-600 hover:underline" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      <div className="m-6 overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="w-10 px-3">
                <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : rows.map((r) => r.id))} />
              </th>
              {th('ID', 'number')}
              {th('Title', 'title')}
              {th('State', 'state')}
              {th('Priority', 'priority')}
              {th('Assigned to')}
              {th('Sprint')}
              {th('Pts', 'points')}
              {th('Due', 'dueDate')}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    onChange={() => setSelected((p) => (p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id]))}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {project?.key}-{i.number}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => openItem(i.id)} className="flex items-center gap-2 text-left font-medium hover:text-[#0078d4]">
                    <TypeIcon type={i.type} /> {i.title}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <StateBadge state={i.state} />
                </td>
                <td className="px-3 py-2">
                  <PriorityBadge priority={i.priority} />
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar member={s.members.find((m) => m.id === i.assigneeId)} size={22} />
                    <span className="text-slate-600">{s.members.find((m) => m.id === i.assigneeId)?.name ?? 'Unassigned'}</span>
                  </span>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border border-transparent bg-transparent py-0.5 text-sm hover:border-slate-300"
                    value={i.sprintId ?? ''}
                    onChange={(e) => actions.updateItem(i.id, { sprintId: e.target.value || null })}
                  >
                    <option value="">Backlog</option>
                    {sprints.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">{i.points || '—'}</td>
                <td className={`whitespace-nowrap px-3 py-2 ${i.dueDate && i.dueDate < today && i.state !== 'Closed' ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                  {fmtDate(i.dueDate)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-500">
                  No work items match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
