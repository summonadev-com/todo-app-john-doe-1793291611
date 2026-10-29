import { useState } from 'react';
import { actions, useStore } from '@/lib/store';
import { Avatar, Card, PageHeader, btnPrimary, field } from '@/components/ui';

const COLORS = ['#0078d4', '#8764b8', '#107c10', '#d83b01', '#038387', '#c239b3', '#986f0b'];

export function TeamPage() {
  const s = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const items = s.items.filter((i) => i.projectId === s.currentProjectId);

  return (
    <div>
      <PageHeader title="Team" subtitle={`${s.members.length} members`} />
      <div className="grid gap-5 p-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Member</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Open items</th>
                <th className="px-4 py-2">Closed</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar member={m} size={32} />
                      <div>
                        <div className="font-medium">
                          {m.name} {m.id === s.currentUserId && <span className="text-xs text-slate-400">(you)</span>}
                        </div>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{m.role}</td>
                  <td className="px-4 py-3">{items.filter((i) => i.assigneeId === m.id && i.state !== 'Closed').length}</td>
                  <td className="px-4 py-3">{items.filter((i) => i.assigneeId === m.id && i.state === 'Closed').length}</td>
                  <td className="px-4 py-3 text-right">
                    {m.id !== s.currentUserId && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          if (confirm(`Remove ${m.name}? Their work items become unassigned.`)) actions.removeMember(m.id);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card title="Add team member">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              actions.addMember({ name: name.trim(), email, role, color: COLORS[s.members.length % COLORS.length] });
              setName('');
              setEmail('');
            }}
          >
            <input className={`${field} w-full`} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" className={`${field} w-full`} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className={`${field} w-full`} value={role} onChange={(e) => setRole(e.target.value)}>
              {['Project Manager', 'Developer', 'Designer', 'QA Engineer', 'Stakeholder'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <button className={`${btnPrimary} w-full`} disabled={!name.trim()}>
              Add member
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
