import { useMemo, useState } from 'react';
import { actions, currentSprintOf, useStore } from '@/lib/store';
import { ITEM_STATES, ITEM_TYPES } from '@/types/pm';
import type { ItemState, ItemType } from '@/types/pm';
import { Avatar, PageHeader, PriorityBadge, STATE_COLOR, TYPE_COLOR, TypeIcon, btnPrimary, field } from '@/components/ui';
import { useItemDialog } from '@/components/ItemDialog';
import { Select } from '@/components/controls';

export function BoardsPage() {
  const s = useStore();
  const { openItem, newItem } = useItemDialog();
  const sprints = useMemo(() => s.sprints.filter((x) => x.projectId === s.currentProjectId), [s.sprints, s.currentProjectId]);
  const [sprintSel, setSprintSel] = useState<string>('auto');
  const [assignee, setAssignee] = useState('all');
  const [type, setType] = useState<'all' | ItemType>('all');
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ItemState | null>(null);
  const [quick, setQuick] = useState<ItemState | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const effectiveSprint = sprintSel === 'auto' ? currentSprintOf(sprints)?.id ?? 'all' : sprintSel;
  const project = s.projects.find((p) => p.id === s.currentProjectId);

  const items = s.items.filter(
    (i) =>
      i.projectId === s.currentProjectId &&
      i.type !== 'Epic' &&
      (effectiveSprint === 'all' || i.sprintId === effectiveSprint) &&
      (assignee === 'all' || (assignee === 'none' ? !i.assigneeId : i.assigneeId === assignee)) &&
      (type === 'all' || i.type === type) &&
      i.title.toLowerCase().includes(search.toLowerCase()),
  );

  function addQuick(state: ItemState) {
    if (!quickTitle.trim()) return;
    actions.addItem({
      projectId: s.currentProjectId,
      title: quickTitle.trim(),
      state,
      sprintId: effectiveSprint === 'all' ? null : effectiveSprint,
    });
    setQuickTitle('');
    setQuick(null);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Boards" subtitle={`${project?.name} · drag cards between columns to update their state`}>
        <button className={btnPrimary} onClick={() => newItem({ sprintId: effectiveSprint === 'all' ? null : effectiveSprint })}>
          + New work item
        </button>
      </PageHeader>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <Select className={field} value={sprintSel} onChange={(e) => setSprintSel(e.target.value)}>
          <option value="auto">Current sprint</option>
          <option value="all">All sprints & backlog</option>
          {sprints.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select className={field} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="all">Everyone</option>
          <option value="none">Unassigned</option>
          {s.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select className={field} value={type} onChange={(e) => setType(e.target.value as 'all' | ItemType)}>
          <option value="all">All types</option>
          {ITEM_TYPES.filter((t) => t !== 'Epic').map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <input className={`${field} w-56`} placeholder="Filter by title" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid min-h-0 flex-1 auto-cols-fr grid-flow-col gap-4 overflow-x-auto p-6">
        {ITEM_STATES.map((st) => {
          const col = items.filter((i) => i.state === st);
          const pts = col.reduce((a, i) => a + i.points, 0);
          return (
            <div
              key={st}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(st);
              }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => {
                if (dragId) actions.updateItem(dragId, { state: st });
                setDragId(null);
                setOverCol(null);
              }}
              className={`flex min-w-64 flex-col rounded border bg-slate-50 ${overCol === st ? 'border-[#0078d4] bg-blue-50' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5" style={{ borderTop: `3px solid ${STATE_COLOR[st]}` }}>
                <span className="text-sm font-semibold">{st}</span>
                <span className="rounded-full bg-slate-200 px-2 text-xs">{col.length}</span>
                <span className="ml-auto text-xs text-slate-500">{pts} pts</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {col.map((i) => {
                  const m = s.members.find((x) => x.id === i.assigneeId);
                  return (
                    <div
                      key={i.id}
                      draggable
                      onDragStart={() => setDragId(i.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      onClick={() => openItem(i.id)}
                      className={`cursor-pointer rounded border border-slate-200 bg-white p-3 shadow-sm hover:shadow ${dragId === i.id ? 'opacity-40' : ''}`}
                      style={{ borderLeft: `4px solid ${TYPE_COLOR[i.type]}` }}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <TypeIcon type={i.type} size={14} /> {project?.key}-{i.number}
                      </div>
                      <p className="text-sm font-medium leading-snug">{i.title}</p>
                      {i.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.tags.map((t) => (
                            <span key={t} className="rounded bg-slate-100 px-1.5 text-[11px] text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar member={m} size={22} />
                        <span className="flex-1 truncate text-xs text-slate-500">{m?.name ?? 'Unassigned'}</span>
                        {i.points > 0 && <span className="rounded-full bg-slate-100 px-2 text-xs">{i.points}</span>}
                        <PriorityBadge priority={i.priority} />
                      </div>
                    </div>
                  );
                })}
                {col.length === 0 && <p className="p-4 text-center text-xs text-slate-400">Drop items here</p>}
              </div>
              <div className="border-t border-slate-200 p-2">
                {quick === st ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addQuick(st);
                    }}
                  >
                    <input
                      autoFocus
                      className={`${field} w-full`}
                      placeholder="Title, then press Enter"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onBlur={() => {
                        if (!quickTitle) setQuick(null);
                      }}
                    />
                  </form>
                ) : (
                  <button onClick={() => setQuick(st)} className="w-full rounded px-2 py-1 text-left text-sm text-[#0078d4] hover:bg-blue-50">
                    + Add item
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
