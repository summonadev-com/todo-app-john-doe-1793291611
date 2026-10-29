import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { actions, useStore } from '@/lib/store';
import { ITEM_STATES, ITEM_TYPES } from '@/types/pm';
import type { ItemState, ItemType, WorkItem } from '@/types/pm';
import { DateField, Select, useConfirm } from '@/components/controls';
import { Avatar, Modal, TypeIcon, btnPrimary, btnSecondary, field, priorityLabel } from '@/components/ui';

interface Ctx {
  openItem: (id: string) => void;
  newItem: (defaults?: Partial<WorkItem>) => void;
}
const ItemCtx = createContext<Ctx>({ openItem: () => {}, newItem: () => {} });
export function useItemDialog(): Ctx {
  return useContext(ItemCtx);
}

type Mode = { kind: 'edit'; id: string } | { kind: 'new'; defaults: Partial<WorkItem> } | null;

export function ItemDialogProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(null);
  const openItem = useCallback((id: string) => setMode({ kind: 'edit', id }), []);
  const newItem = useCallback((defaults: Partial<WorkItem> = {}) => setMode({ kind: 'new', defaults }), []);
  const value = useMemo(() => ({ openItem, newItem }), [openItem, newItem]);
  return (
    <ItemCtx.Provider value={value}>
      {children}
      {mode && <ItemForm key={mode.kind === 'edit' ? mode.id : 'new'} mode={mode} onClose={() => setMode(null)} />}
    </ItemCtx.Provider>
  );
}

function ItemForm({ mode, onClose }: { mode: NonNullable<Mode>; onClose: () => void }) {
  const s = useStore();
  const confirmDlg = useConfirm();
  const existing = mode.kind === 'edit' ? s.items.find((i) => i.id === mode.id) : undefined;
  const projectId = existing?.projectId ?? s.currentProjectId;
  const project = s.projects.find((p) => p.id === projectId);
  const sprints = s.sprints.filter((x) => x.projectId === projectId);

  const [draft, setDraft] = useState({
    title: existing?.title ?? '',
    type: (existing?.type ?? 'Story') as ItemType,
    state: (existing?.state ?? 'New') as ItemState,
    priority: existing?.priority ?? 3,
    assigneeId: existing?.assigneeId ?? null,
    sprintId: existing?.sprintId ?? null,
    points: existing?.points ?? 0,
    dueDate: existing?.dueDate ?? '',
    tags: (existing?.tags ?? []).join(', '),
    description: existing?.description ?? '',
    ...(mode.kind === 'new' ? mode.defaults : {}),
  } as {
    title: string;
    type: ItemType;
    state: ItemState;
    priority: 1 | 2 | 3 | 4;
    assigneeId: string | null;
    sprintId: string | null;
    points: number;
    dueDate: string;
    tags: string;
    description: string;
  });
  const [comment, setComment] = useState('');

  function patch<K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function save() {
    if (!draft.title.trim()) return;
    const data = {
      title: draft.title.trim(),
      type: draft.type,
      state: draft.state,
      priority: draft.priority,
      assigneeId: draft.assigneeId,
      sprintId: draft.sprintId,
      points: Number(draft.points) || 0,
      dueDate: draft.dueDate,
      description: draft.description,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (existing) actions.updateItem(existing.id, data);
    else actions.addItem({ ...data, projectId });
    onClose();
  }

  const label = 'mb-1 block text-xs font-medium text-slate-600';
  return (
    <Modal
      wide
      onClose={onClose}
      title={existing ? `${project?.key}-${existing.number} · Edit work item` : `New work item in ${project?.name}`}
    >
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <div>
            <label className={label}>Title</label>
            <div className="flex items-center gap-2">
              <TypeIcon type={draft.type} size={22} />
              <input autoFocus className={`${field} w-full`} value={draft.title} onChange={(e) => patch('title', e.target.value)} placeholder="Enter a title" />
            </div>
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea className={`${field} h-32 w-full`} value={draft.description} onChange={(e) => patch('description', e.target.value)} placeholder="Describe the work, acceptance criteria, repro steps..." />
          </div>
          <div>
            <label className={label}>Tags (comma separated)</label>
            <input className={`${field} w-full`} value={draft.tags} onChange={(e) => patch('tags', e.target.value)} />
          </div>
          {existing && (
            <div>
              <label className={label}>Discussion</label>
              <ul className="mb-2 space-y-2">
                {existing.comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
                {existing.comments.map((c) => (
                  <li key={c.id} className="flex gap-2 rounded bg-slate-50 p-2 text-sm">
                    <Avatar member={s.members.find((m) => m.id === c.authorId)} />
                    <div>
                      <div className="text-xs text-slate-500">
                        {s.members.find((m) => m.id === c.authorId)?.name ?? 'Unknown'} · {new Date(c.createdAt).toLocaleString()}
                      </div>
                      {c.text}
                    </div>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  actions.addComment(existing.id, comment.trim());
                  setComment('');
                }}
              >
                <input className={`${field} flex-1`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" />
                <button className={btnSecondary}>Post</button>
              </form>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className={label}>Type</label>
            <Select className={`${field} w-full`} value={draft.type} onChange={(e) => patch('type', e.target.value as ItemType)}>
              {ITEM_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={label}>State</label>
            <Select className={`${field} w-full`} value={draft.state} onChange={(e) => patch('state', e.target.value as ItemState)}>
              {ITEM_STATES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={label}>Assigned to</label>
            <Select className={`${field} w-full`} value={draft.assigneeId ?? ''} onChange={(e) => patch('assigneeId', e.target.value || null)}>
              <option value="">Unassigned</option>
              {s.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={label}>Priority</label>
            <Select className={`${field} w-full`} value={draft.priority} onChange={(e) => patch('priority', Number(e.target.value) as 1 | 2 | 3 | 4)}>
              {([1, 2, 3, 4] as const).map((p) => (
                <option key={p} value={p}>
                  {p} - {priorityLabel[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={label}>Sprint</label>
            <Select className={`${field} w-full`} value={draft.sprintId ?? ''} onChange={(e) => patch('sprintId', e.target.value || null)}>
              <option value="">Backlog (no sprint)</option>
              {sprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Story points</label>
              <input type="number" min={0} className={`${field} w-full`} value={draft.points} onChange={(e) => patch('points', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Due date</label>
              <DateField className={`${field} w-full`} value={draft.dueDate} onChange={(v) => patch('dueDate', v)} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
        {existing ? (
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={async () => {
              if (await confirmDlg({ title: 'Delete work item', message: 'This work item will be permanently deleted.', confirmLabel: 'Delete' })) {
                actions.deleteItem(existing.id);
                onClose();
              }
            }}
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} onClick={save} disabled={!draft.title.trim()}>
            {existing ? 'Save & close' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
