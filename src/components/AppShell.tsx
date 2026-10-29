import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { actions, useStore } from '@/lib/store';
import { Avatar, Modal, TypeIcon, btnPrimary, btnSecondary, field } from '@/components/ui';
import { ItemDialogProvider, useItemDialog } from '@/components/ItemDialog';

const NAV = [
  { to: '/', label: 'Overview', icon: '▦' },
  { to: '/boards', label: 'Boards', icon: '☰' },
  { to: '/backlog', label: 'Backlog', icon: '≣' },
  { to: '/sprints', label: 'Sprints', icon: '⟳' },
  { to: '/team', label: 'Team', icon: '☺' },
  { to: '/settings', label: 'Project settings', icon: '⚙' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ItemDialogProvider>
      <Shell>{children}</Shell>
    </ItemDialogProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const s = useStore();
  const { openItem, newItem } = useItemDialog();
  const [query, setQuery] = useState('');
  const [showProject, setShowProject] = useState(false);
  const project = s.projects.find((p) => p.id === s.currentProjectId);
  const me = s.members.find((m) => m.id === s.currentUserId);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return s.items
      .filter((i) => {
        const key = s.projects.find((p) => p.id === i.projectId)?.key ?? '';
        return i.title.toLowerCase().includes(q) || `${key}-${i.number}`.toLowerCase().includes(q) || String(i.number) === q;
      })
      .slice(0, 8);
  }, [query, s.items, s.projects]);

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex h-12 shrink-0 items-center gap-4 bg-[#0078d4] px-4 text-white">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-white text-sm font-bold text-[#0078d4]">P</span>
          ProjectHub
        </Link>
        <div className="relative ml-4 w-full max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search work items by title or ID"
            className="w-full rounded bg-white/15 px-3 py-1.5 text-sm text-white placeholder-white/70 outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400"
          />
          {query && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded bg-white text-slate-900 shadow-xl">
              {results.length === 0 && <p className="p-3 text-sm text-slate-500">No matching work items.</p>}
              {results.map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    openItem(i.id);
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100"
                >
                  <TypeIcon type={i.type} />
                  <span className="text-slate-500">
                    {s.projects.find((p) => p.id === i.projectId)?.key}-{i.number}
                  </span>
                  <span className="truncate">{i.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => newItem()} className="rounded bg-white px-3 py-1 text-sm font-medium text-[#0078d4] hover:bg-slate-100">
            + New work item
          </button>
          <Avatar member={me} size={28} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Project</label>
            <select className={`${field} w-full`} value={s.currentProjectId} onChange={(e) => actions.setProject(e.target.value)}>
              {s.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button onClick={() => setShowProject(true)} className="mt-2 text-xs text-[#0078d4] hover:underline">
              + New project
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 p-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === '/' }}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                activeProps={{ className: 'flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold bg-blue-50 text-[#0078d4]' }}
              >
                <span className="w-4 text-center">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
            <span className="font-semibold">{project?.key}</span> · {s.items.filter((i) => i.projectId === s.currentProjectId).length} work items
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      {showProject && <ProjectDialog onClose={() => setShowProject(false)} />}
    </div>
  );
}

function ProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  return (
    <Modal title="Create new project" onClose={onClose}>
      <form
        className="space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          actions.addProject(name.trim(), (key || name.slice(0, 3)).trim(), description);
          onClose();
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Project name</label>
          <input autoFocus className={`${field} w-full`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Key (e.g. WEB)</label>
          <input className={`${field} w-full uppercase`} maxLength={5} value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
          <textarea className={`${field} h-20 w-full`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={!name.trim()}>
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
