"use client";

import { Database, NotebookPen, Pin, PinOff, Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteNote, saveNote, setNotePinned } from "@/app/actions";
import type { AppData } from "@/lib/data";
import { formatDay } from "@/lib/format";
import { NOTE_COLORS, type Note, type NoteColor } from "@/lib/types";
import { Page } from "./AppShell";
import { withAppData } from "./WithData";
import { DemoBanner, EmptyState, ErrorText, Fab, PageHeader, Sheet, SheetActions, Tile, inputClass, plural, primaryButton } from "./ui";

const COLOR: Record<NoteColor, { tint: string; dot: string; label: string }> = {
  none: { tint: "", dot: "rgb(255 255 255 / 0.35)", label: "Без цвета" },
  lime: { tint: "rgb(179 232 111 / 0.14)", dot: "#b3e86f", label: "Лайм" },
  sky: { tint: "rgb(157 188 255 / 0.14)", dot: "#9dbcff", label: "Голубой" },
  amber: { tint: "rgb(255 210 122 / 0.14)", dot: "#ffd27a", label: "Янтарь" },
  rose: { tint: "rgb(255 155 140 / 0.14)", dot: "#ff9b8c", label: "Розовый" },
};

type Editing = { note: Note | null } | null;

function NotesScreen({ data, openNew }: { data: AppData; openNew: boolean }) {
  const { notes, demo } = data;
  const [editing, setEditing] = useState<Editing>(openNew && notes !== null ? { note: null } : null);
  const [query, setQuery] = useState("");

  const { pinned, rest } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (notes ?? []).filter((n) => !q || `${n.title ?? ""} ${n.body}`.toLowerCase().includes(q));
    return { pinned: list.filter((n) => n.pinned), rest: list.filter((n) => !n.pinned) };
  }, [notes, query]);

  if (notes === null) {
    return (
      <Page>
        <PageHeader title="Заметки" />
        <Tile className="mt-4 max-w-xl p-6">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
            <Database size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Заметки недоступны</h2>
          <p className="mt-2 text-muted">
            Хранилище браузера недоступно — разрешите сайту сохранять данные и обновите страницу.
          </p>
        </Tile>
      </Page>
    );
  }

  const total = notes.length;
  const open = (note: Note | null) => setEditing({ note });

  return (
    <Page>
      {demo && <DemoBanner />}
      <PageHeader
        title="Заметки"
        subtitle={total ? `${total} ${plural(total, ["заметка", "заметки", "заметок"])}` : "Мысли, задачи, напоминания"}
        actions={
          <>
            <label className="flex h-11 w-full items-center gap-2.5 rounded-full bg-white/[0.08] px-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent)] sm:w-64">
              <Search size={18} className="text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти в заметках"
                aria-label="Поиск по заметкам"
                className="w-full bg-transparent outline-none placeholder:text-faint"
              />
            </label>
            <button onClick={() => open(null)} className={`${primaryButton} max-lg:hidden`}>
              <Plus size={18} strokeWidth={2.4} /> Новая заметка
            </button>
          </>
        }
      />

      {total === 0 ? (
        <Tile className="mt-4">
          <EmptyState icon={NotebookPen} title="Заметок пока нет">
            Записывайте идеи, договорённости с клиентами, списки покупок — всё под рукой рядом с деньгами.
          </EmptyState>
          <div className="flex justify-center pb-8">
            <button onClick={() => open(null)} className={primaryButton}>
              <Plus size={18} /> Написать заметку
            </button>
          </div>
        </Tile>
      ) : (
        <>
          {pinned.length > 0 && <NoteGrid title="Закреплённые" notes={pinned} onOpen={open} />}
          {rest.length > 0 && <NoteGrid title={pinned.length ? "Остальные" : undefined} notes={rest} onOpen={open} />}
          {pinned.length + rest.length === 0 && <p className="mt-8 text-center text-muted">Ничего не нашлось.</p>}
        </>
      )}

      <Fab label="Новая заметка" onClick={() => open(null)}>
        <Plus size={24} strokeWidth={2.4} />
      </Fab>
      {editing && (
        <NoteSheet
          key={editing.note?.id ?? "new"}
          note={editing.note}
          onClose={() => {
            setEditing(null);
            // Убираем ?new=1, чтобы после обновления страницы шторка не открылась снова.
            if (window.location.search.includes("new=1")) window.history.replaceState(null, "", "/notes");
          }}
        />
      )}
    </Page>
  );
}

function NoteGrid({ title, notes, onOpen }: { title?: string; notes: Note[]; onOpen: (n: Note) => void }) {
  return (
    <section className="mt-5">
      {title && <h2 className="mb-2.5 text-[13px] font-medium text-muted">{title}</h2>}
      <ul className="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
        {notes.map((n, i) => (
          <NoteCard key={n.id} note={n} i={i} onOpen={() => onOpen(n)} />
        ))}
      </ul>
    </section>
  );
}

function NoteCard({ note, i, onOpen }: { note: Note; i: number; onOpen: () => void }) {
  const [pending, start] = useTransition();
  const color = COLOR[note.color] ?? COLOR.none;
  return (
    <li className="tile rise relative mb-3 break-inside-avoid" style={{ background: color.tint || undefined, ["--i" as string]: Math.min(i, 10) }}>
      <button onClick={onOpen} className="block w-full p-4 pr-12 text-left lg:p-5 lg:pr-12">
        {note.title && <span className="block font-semibold">{note.title}</span>}
        <span className={`line-clamp-[8] block text-[15px] leading-relaxed whitespace-pre-line text-ink/85 ${note.title ? "mt-1" : ""}`}>{note.body}</span>
        <span className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="size-2 rounded-full" style={{ background: color.dot }} aria-hidden />
          {formatDay(note.updated_at.slice(0, 10))}
        </span>
      </button>
      <button
        onClick={() => start(async () => void (await setNotePinned(note.id, !note.pinned)))}
        disabled={pending}
        aria-label={note.pinned ? "Открепить" : "Закрепить"}
        title={note.pinned ? "Открепить" : "Закрепить"}
        className={`press absolute top-3 right-3 grid size-8 place-items-center rounded-full transition-colors hover:bg-white/15 ${
          note.pinned ? "text-accent" : "text-faint"
        }`}
      >
        {note.pinned ? <Pin size={16} fill="currentColor" /> : <Pin size={16} />}
      </button>
    </li>
  );
}

function NoteSheet({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [color, setColor] = useState<NoteColor>(note?.color ?? "none");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim() && !body.trim()) return setError("Напишите хоть что-нибудь.");
    setError(null);
    startTransition(async () => {
      const result = await saveNote({ id: note?.id, title, body, color, pinned });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!note) return;
    if (!confirmDelete) return setConfirmDelete(true);
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Sheet title={note ? "Заметка" : "Новая заметка"} onClose={onClose}>
      <div className="mt-5 grid grid-cols-1 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" aria-label="Заголовок" maxLength={120} className={`${inputClass} font-semibold`} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Текст заметки"
          aria-label="Текст заметки"
          rows={9}
          autoFocus={!note}
          maxLength={5000}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Цвет" className="flex gap-2">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={COLOR[c].label}
              onClick={() => setColor(c)}
              className={`press grid size-9 place-items-center rounded-full border-2 transition-colors ${color === c ? "border-ink" : "border-transparent"}`}
            >
              <span className="size-6 rounded-full" style={{ background: c === "none" ? "rgb(255 255 255 / 0.18)" : COLOR[c].dot }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPinned(!pinned)}
          aria-pressed={pinned}
          className={`press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors ${
            pinned ? "bg-accent text-accent-ink" : "bg-white/10 text-ink hover:bg-white/15"
          }`}
        >
          {pinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
          {pinned ? "Закреплена" : "Закрепить"}
        </button>
      </div>

      {note && <p className="mt-4 text-xs text-muted">Создана {formatDay(note.created_at.slice(0, 10))}, изменена {formatDay(note.updated_at.slice(0, 10))}</p>}
      {error && <ErrorText>{error}</ErrorText>}
      <SheetActions
        pending={pending}
        submitLabel={note ? "Сохранить" : "Добавить заметку"}
        onSubmit={save}
        onDelete={note ? remove : undefined}
        confirmDelete={confirmDelete}
        deleteLabel="Удалить заметку"
      />
    </Sheet>
  );
}

export const NotesView = withAppData(NotesScreen);
