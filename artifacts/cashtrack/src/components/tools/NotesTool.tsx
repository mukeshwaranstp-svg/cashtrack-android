import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Plus, X as CloseIcon } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: Date;
}

const SEED_NOTES: Note[] = [
  {
    id: '1',
    title: 'Financial Goals 2026',
    body: '- Save ₹2L for emergency fund\n- Invest 20% of income\n- Cut down eating out to twice a month',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
  {
    id: '2',
    title: 'Grocery List',
    body: 'Milk, Eggs, Bread\nCoffee beans (the good ones)\nApples, Bananas\nCleaning supplies',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  }
];

export function NotesTool() {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleNewNote = () => {
    const newNote = {
      id: Math.random().toString(36).substring(7),
      title: '',
      body: '',
      updatedAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    setEditTitle('');
    setEditBody('');
    setEditingId(newNote.id);
  };

  const handleEditNote = (note: Note) => {
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditingId(note.id);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter((n) => n.id !== id));
  };

  const handleSave = () => {
    if (!editingId) return;
    setNotes(notes.map((n) => {
      if (n.id === editingId) {
        // Only save if there's actual content
        if (!editTitle.trim() && !editBody.trim()) return n;
        return {
          ...n,
          title: editTitle.trim() || 'Untitled Note',
          body: editBody,
          updatedAt: new Date(),
        };
      }
      return n;
    }).filter(n => n.title || n.body)); // Remove empty notes
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <AnimatePresence mode="wait">
        {editingId ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-[400px]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <span className="font-bold text-sm tracking-wide text-foreground">Editing Note</span>
              <button
                onClick={handleSave}
                className="text-xs font-bold text-background bg-primary px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
            <div className="flex flex-col p-4 flex-1">
              <input
                type="text"
                placeholder="Title..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border-none outline-none mb-4 tracking-tight"
              />
              <textarea
                placeholder="Start typing..."
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 border-none outline-none flex-1 resize-none leading-relaxed"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight">My Notes</h2>
              <button
                onClick={handleNewNote}
                className="flex items-center gap-1 text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                New Note
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border border-dashed bg-card/50">
                <span className="text-muted-foreground mb-4">No notes yet</span>
                <button
                  onClick={handleNewNote}
                  className="flex items-center gap-1 text-sm font-bold text-foreground bg-secondary px-4 py-2 rounded-full border border-border shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create your first note
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleEditNote(note)}
                    className="group flex items-start justify-between p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col overflow-hidden pr-4">
                      <span className="font-bold text-foreground truncate">{note.title}</span>
                      <span className="text-sm text-muted-foreground truncate mt-1">
                        {note.body.split('\n')[0] || 'No extra text'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mt-2">
                        {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
