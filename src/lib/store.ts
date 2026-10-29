import { useSyncExternalStore } from 'react';
import type { AppState, Comment, ItemState, ItemType, Member, Project, Sprint, WorkItem } from '@/types/pm';

const KEY = 'projecthub-v1';

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
export function todayIso(): string {
  return iso(new Date());
}
function uid(): string {
  return crypto.randomUUID();
}

function seed(): AppState {
  const t = new Date();
  const d = (n: number) => iso(addDays(t, n));
  const projects: Project[] = [
    { id: 'p1', name: 'Contoso Web Platform', key: 'CWP', description: 'Customer portal and public website.' },
    { id: 'p2', name: 'Mobile App', key: 'MOB', description: 'iOS and Android companion apps.' },
  ];
  const members: Member[] = [
    { id: 'm1', name: 'Alex Morgan', email: 'alex@contoso.com', role: 'Project Manager', color: '#0078d4' },
    { id: 'm2', name: 'Priya Shah', email: 'priya@contoso.com', role: 'Developer', color: '#8764b8' },
    { id: 'm3', name: 'Daniel Kim', email: 'daniel@contoso.com', role: 'Developer', color: '#107c10' },
    { id: 'm4', name: 'Sofia Rossi', email: 'sofia@contoso.com', role: 'Designer', color: '#d83b01' },
    { id: 'm5', name: 'Marcus Lee', email: 'marcus@contoso.com', role: 'QA Engineer', color: '#038387' },
  ];
  const sprints: Sprint[] = [
    { id: 's1', projectId: 'p1', name: 'Sprint 1', start: d(-24), end: d(-11), goal: 'Foundation and authentication' },
    { id: 's2', projectId: 'p1', name: 'Sprint 2', start: d(-10), end: d(3), goal: 'Customer dashboard and billing' },
    { id: 's3', projectId: 'p1', name: 'Sprint 3', start: d(4), end: d(17), goal: 'Reporting and performance' },
    { id: 's4', projectId: 'p2', name: 'Sprint 1', start: d(-7), end: d(6), goal: 'Onboarding flow' },
  ];
  let n = 100;
  const items: WorkItem[] = [];
  const mk = (
    projectId: string,
    type: ItemType,
    title: string,
    state: ItemState,
    priority: 1 | 2 | 3 | 4,
    assigneeId: string | null,
    sprintId: string | null,
    points: number,
    extra: Partial<WorkItem> = {},
  ) => {
    n += 1;
    items.push({
      id: uid(),
      number: n,
      projectId,
      type,
      title,
      description: '',
      state,
      priority,
      assigneeId,
      sprintId,
      points,
      dueDate: '',
      tags: [],
      comments: [],
      createdAt: new Date().toISOString(),
      closedAt: state === 'Closed' ? d(-12) : null,
      ...extra,
    });
  };
  mk('p1', 'Epic', 'Customer self-service portal', 'Active', 1, 'm1', null, 0, { tags: ['portal'] });
  mk('p1', 'Feature', 'Single sign-on with Microsoft Entra ID', 'Closed', 1, 'm2', 's1', 8, { closedAt: d(-14), tags: ['auth'] });
  mk('p1', 'Story', 'As a user I can reset my password', 'Closed', 2, 'm3', 's1', 3, { closedAt: d(-13), tags: ['auth'] });
  mk('p1', 'Story', 'Design system and component library', 'Closed', 2, 'm4', 's1', 5, { closedAt: d(-12), tags: ['design'] });
  mk('p1', 'Story', 'Customer dashboard overview page', 'Active', 1, 'm2', 's2', 8, { dueDate: d(2), tags: ['dashboard'], description: 'Show account health, recent invoices and open support tickets.' });
  mk('p1', 'Story', 'Invoice list with filtering and export', 'Active', 2, 'm3', 's2', 5, { dueDate: d(1), tags: ['billing'] });
  mk('p1', 'Story', 'Payment method management', 'New', 2, 'm3', 's2', 5, { tags: ['billing'] });
  mk('p1', 'Task', 'Set up Stripe webhook handler', 'Resolved', 2, 'm3', 's2', 3, { tags: ['billing'] });
  mk('p1', 'Task', 'Write E2E tests for dashboard', 'New', 3, 'm5', 's2', 3, { tags: ['qa'] });
  mk('p1', 'Bug', 'Invoice PDF cuts off long company names', 'Active', 2, 'm2', 's2', 2, { tags: ['billing'], dueDate: d(-1) });
  mk('p1', 'Bug', 'Login redirect loop on Safari', 'Closed', 1, 'm5', 's2', 2, { closedAt: d(-5), tags: ['auth'] });
  mk('p1', 'Story', 'Dashboard layout polish for tablets', 'Closed', 3, 'm4', 's2', 2, { closedAt: d(-3), tags: ['design'] });
  mk('p1', 'Feature', 'Usage reporting and analytics', 'New', 2, 'm1', 's3', 13, { tags: ['reporting'] });
  mk('p1', 'Story', 'Scheduled email reports', 'New', 3, null, 's3', 8, { tags: ['reporting'] });
  mk('p1', 'Task', 'Profile slow API endpoints', 'New', 2, 'm2', 's3', 5, { tags: ['perf'] });
  mk('p1', 'Story', 'Dark mode support', 'New', 4, null, null, 5, { tags: ['design'] });
  mk('p1', 'Story', 'Localization for German and French', 'New', 3, null, null, 13, { tags: ['i18n'] });
  mk('p1', 'Bug', 'Notification badge count is wrong after logout', 'New', 3, null, null, 1);
  mk('p2', 'Epic', 'Mobile onboarding experience', 'Active', 1, 'm1', null, 0);
  mk('p2', 'Story', 'Welcome carousel', 'Closed', 3, 'm4', 's4', 3, { closedAt: d(-4) });
  mk('p2', 'Story', 'Biometric sign-in', 'Active', 1, 'm3', 's4', 8);
  mk('p2', 'Task', 'Push notification setup', 'New', 2, 'm2', 's4', 5);
  mk('p2', 'Bug', 'App crashes on Android 9 at launch', 'Active', 1, 'm5', 's4', 3);
  return { projects, members, sprints, items, currentProjectId: 'p1', currentUserId: 'm1', nextNumber: n + 1 };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* fall through */
  }
  return seed();
}

let state: AppState = load();
const listeners = new Set<() => void>();

function set(fn: (s: AppState) => AppState) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export const actions = {
  setProject(id: string) {
    set((s) => ({ ...s, currentProjectId: id }));
  },
  addProject(name: string, key: string, description: string): string {
    const id = uid();
    set((s) => ({
      ...s,
      projects: [...s.projects, { id, name, key: key.toUpperCase(), description }],
      currentProjectId: id,
    }));
    return id;
  },
  updateProject(id: string, patch: Partial<Project>) {
    set((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  },
  deleteProject(id: string) {
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      if (projects.length === 0) return s;
      return {
        ...s,
        projects,
        items: s.items.filter((i) => i.projectId !== id),
        sprints: s.sprints.filter((x) => x.projectId !== id),
        currentProjectId: s.currentProjectId === id ? projects[0].id : s.currentProjectId,
      };
    });
  },
  addItem(input: Partial<WorkItem> & { title: string; projectId: string }): string {
    const id = uid();
    set((s) => {
      const item: WorkItem = {
        id,
        number: s.nextNumber,
        type: 'Story',
        description: '',
        state: 'New',
        priority: 3,
        assigneeId: null,
        sprintId: null,
        points: 0,
        dueDate: '',
        tags: [],
        comments: [],
        createdAt: new Date().toISOString(),
        closedAt: null,
        ...input,
      };
      if (item.state === 'Closed') item.closedAt = todayIso();
      return { ...s, items: [item, ...s.items], nextNumber: s.nextNumber + 1 };
    });
    return id;
  },
  updateItem(id: string, patch: Partial<WorkItem>) {
    set((s) => ({
      ...s,
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...patch };
        if (patch.state && patch.state !== i.state) {
          next.closedAt = patch.state === 'Closed' ? todayIso() : null;
        }
        return next;
      }),
    }));
  },
  deleteItem(id: string) {
    set((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  },
  addComment(itemId: string, text: string) {
    set((s) => {
      const c: Comment = { id: uid(), authorId: s.currentUserId, text, createdAt: new Date().toISOString() };
      return { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, comments: [...i.comments, c] } : i)) };
    });
  },
  addSprint(input: Omit<Sprint, 'id'>): string {
    const id = uid();
    set((s) => ({ ...s, sprints: [...s.sprints, { ...input, id }] }));
    return id;
  },
  updateSprint(id: string, patch: Partial<Sprint>) {
    set((s) => ({ ...s, sprints: s.sprints.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
  deleteSprint(id: string) {
    set((s) => ({
      ...s,
      sprints: s.sprints.filter((x) => x.id !== id),
      items: s.items.map((i) => (i.sprintId === id ? { ...i, sprintId: null } : i)),
    }));
  },
  addMember(input: Omit<Member, 'id'>) {
    set((s) => ({ ...s, members: [...s.members, { ...input, id: uid() }] }));
  },
  removeMember(id: string) {
    set((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
      items: s.items.map((i) => (i.assigneeId === id ? { ...i, assigneeId: null } : i)),
    }));
  },
  resetDemoData() {
    set(() => seed());
  },
};

export function sprintStatus(sp: Sprint): 'Past' | 'Current' | 'Upcoming' {
  const t = todayIso();
  if (sp.end < t) return 'Past';
  if (sp.start > t) return 'Upcoming';
  return 'Current';
}

export function currentSprintOf(sprints: Sprint[]): Sprint | undefined {
  return sprints.find((s) => sprintStatus(s) === 'Current') ?? sprints.find((s) => sprintStatus(s) === 'Upcoming') ?? sprints[sprints.length - 1];
}
