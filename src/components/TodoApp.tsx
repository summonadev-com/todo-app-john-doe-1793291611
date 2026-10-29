import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, Todo } from '@/types/todo';

const CATEGORIES = ['General', 'Engineering', 'Marketing', 'Sales', 'Operations', 'HR'];
const STORAGE_KEY = 'team-tasks-v1';

const priorityStyle: Record<Priority, string> = {
  high: 'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const today = new Date().toISOString().slice(0, 10);

  function addTodo(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setTodos((t) => [
      { id: crypto.randomUUID(), title: title.trim(), priority, category, dueDate, done: false },
      ...t,
    ]);
    setTitle('');
    setDueDate('');
  }

  const visible = useMemo(() => {
    return todos
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => (status === 'all' ? true : status === 'done' ? t.done : !t.done))
      .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
      .filter((t) => filterCategory === 'all' || t.category === filterCategory)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (priorityRank[a.priority] !== priorityRank[b.priority])
          return priorityRank[a.priority] - priorityRank[b.priority];
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      });
  }, [todos, search, status, filterPriority, filterCategory]);

  const doneCount = todos.filter((t) => t.done).length;
  const overdue = todos.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
  const field =
    'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Team Task Manager</h1>
            <p className="text-sm text-slate-400">Track priorities, owners' categories and deadlines in one place.</p>
          </div>
          <div className="flex gap-3 text-center text-sm">
            <Stat label="Total" value={todos.length} />
            <Stat label="Completed" value={doneCount} />
            <Stat label="Overdue" value={overdue} warn={overdue > 0} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <form onSubmit={addTodo} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">New task</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <input className={field} placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="date" className={field} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <button className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800">Add task</button>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
            <input className={`${field} min-w-52 flex-1`} placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'open' | 'done')}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="done">Completed</option>
            </select>
            <select className={field} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as 'all' | Priority)}>
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className={field} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">
              {todos.length === 0 ? 'No tasks yet. Add your first task above.' : 'No tasks match your filters.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((t) => {
                const late = !t.done && t.dueDate && t.dueDate < today;
                return (
                  <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => setTodos((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                      className="h-4 w-4 accent-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.category}
                        {t.dueDate && (
                          <span className={late ? 'ml-2 font-medium text-red-600' : 'ml-2'}>
                            · Due {new Date(t.dueDate + 'T00:00').toLocaleDateString()}
                            {late ? ' (overdue)' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${priorityStyle[t.priority]}`}>
                      {t.priority}
                    </span>
                    <button
                      onClick={() => setTodos((l) => l.filter((x) => x.id !== t.id))}
                      className="text-sm text-slate-400 hover:text-red-600"
                      aria-label="Delete task"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="min-w-20 rounded-md bg-slate-800 px-4 py-2">
      <div className={`text-lg font-semibold ${warn ? 'text-red-400' : ''}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
