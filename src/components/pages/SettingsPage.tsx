import { useState } from 'react';
import { actions, useStore } from '@/lib/store';
import { useConfirm } from '@/components/controls';
import { Card, PageHeader, btnPrimary, btnSecondary, field } from '@/components/ui';

export function SettingsPage() {
  const s = useStore();
  const project = s.projects.find((p) => p.id === s.currentProjectId);
  if (!project) return null;
  return <Form key={project.id} />;
}

function Form() {
  const s = useStore();
  const project = s.projects.find((p) => p.id === s.currentProjectId)!;
  const confirmDlg = useConfirm();
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [description, setDescription] = useState(project.description);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader title="Project settings" subtitle={project.name} />
      <div className="max-w-2xl space-y-5 p-6">
        <Card title="General">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              actions.updateProject(project.id, { name: name.trim(), key: key.toUpperCase(), description });
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
              <input className={`${field} w-full`} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Key</label>
              <input className={`${field} w-32 uppercase`} maxLength={5} value={key} onChange={(e) => setKey(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <textarea className={`${field} h-24 w-full`} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <button className={btnPrimary} disabled={!name.trim()}>
                Save changes
              </button>
              {saved && <span className="text-sm text-emerald-600">Saved</span>}
            </div>
          </form>
        </Card>
        <Card title="Danger zone">
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded border border-red-300 px-3.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
              disabled={s.projects.length < 2}
              title={s.projects.length < 2 ? 'You need at least one project' : ''}
              onClick={async () => {
                if (await confirmDlg({ title: 'Delete project', message: `Delete "${project.name}" and all of its work items and sprints?`, confirmLabel: 'Delete project' }))
                  actions.deleteProject(project.id);
              }}
            >
              Delete this project
            </button>
            <button
              className={btnSecondary}
              onClick={async () => {
                if (await confirmDlg({ title: 'Reset to sample data', message: 'Everything will be replaced with the sample data. Your changes will be lost.', confirmLabel: 'Reset' }))
                  actions.resetDemoData();
              }}
            >
              Reset to sample data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
