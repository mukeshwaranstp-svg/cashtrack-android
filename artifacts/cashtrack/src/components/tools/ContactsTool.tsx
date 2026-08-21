import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X as CloseIcon } from 'lucide-react';
import { formatCurrency } from '@/utils';

type Relation = 'owes you' | 'you owe' | 'settled';

interface Contact {
  id: string;
  name: string;
  relation: Relation;
  amount: number;
  phone?: string;
}

const SEED_CONTACTS: Contact[] = [
  { id: '1', name: 'Rohan Sharma', relation: 'owes you', amount: 1250, phone: '+91 98765 43210' },
  { id: '2', name: 'Priya Patel', relation: 'you owe', amount: 800 },
  { id: '3', name: 'Arjun Gupta', relation: 'owes you', amount: 3500, phone: '+91 87654 32109' },
  { id: '4', name: 'Sneha Reddy', relation: 'settled', amount: 0 },
  { id: '5', name: 'Karan Singh', relation: 'you owe', amount: 2100, phone: '+91 76543 21098' },
  { id: '6', name: 'Neha Kumar', relation: 'settled', amount: 0 },
];

const COLORS = [
  'bg-blue-500/20 text-blue-500 border-blue-500/30',
  'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  'bg-purple-500/20 text-purple-500 border-purple-500/30',
  'bg-orange-500/20 text-orange-500 border-orange-500/30',
  'bg-pink-500/20 text-pink-500 border-pink-500/30',
];

function getAvatarProps(name: string) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = COLORS[hash % COLORS.length];
  return { initials, colorClass };
}

type FilterType = 'all' | 'owes you' | 'you owe' | 'settled';

export function ContactsTool() {
  const [contacts, setContacts] = useState<Contact[]>(SEED_CONTACTS);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    if (filter === 'all') return contacts;
    return contacts.filter(c => c.relation === filter);
  }, [contacts, filter]);

  const handleSettle = () => {
    if (!selectedContact) return;
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? { ...c, relation: 'settled', amount: 0 } : c
    ));
    setSelectedContact({ ...selectedContact, relation: 'settled', amount: 0 });
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight">Contacts</h2>
      </div>

      <div className="flex flex-wrap gap-2 px-1">
        {(['all', 'owes you', 'you owe', 'settled'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide capitalize transition-colors border ${
              filter === f
                ? 'bg-primary text-background border-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredContacts.length === 0 ? (
        <div className="flex items-center justify-center p-12 text-center rounded-2xl border border-border border-dashed bg-card/50 mt-4">
          <span className="text-muted-foreground font-medium text-sm tracking-wide">No contacts found</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          {filteredContacts.map((contact, i) => {
            const { initials, colorClass } = getAvatarProps(contact.name);
            return (
              <motion.button
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedContact(contact)}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/50 transition-colors w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${colorClass}`}>
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{contact.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                        contact.relation === 'owes you' ? 'text-primary bg-primary/10 border-primary/20' :
                        contact.relation === 'you owe' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                        'text-muted-foreground bg-background border-border'
                      }`}>
                        {contact.relation}
                      </span>
                      {contact.phone && <Phone className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
                
                {contact.amount > 0 && (
                  <span className="font-bold tabular-nums text-foreground">
                    {formatCurrency(contact.amount)}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail Modal/Bottom Sheet */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContact(null)}
              className="absolute inset-x-[-24px] inset-y-[-24px] bg-background/80 backdrop-blur-sm z-10 sm:inset-x-[-32px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-card border border-border rounded-t-2xl shadow-xl z-20 flex flex-col p-6 pb-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border ${getAvatarProps(selectedContact.name).colorClass}`}>
                    {getAvatarProps(selectedContact.name).initials}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold tracking-tight">{selectedContact.name}</h3>
                    {selectedContact.phone && (
                      <span className="text-sm text-muted-foreground mt-0.5">{selectedContact.phone}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 text-muted-foreground hover:text-foreground bg-background rounded-full border border-border transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center bg-background rounded-xl p-6 border border-border mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  selectedContact.relation === 'owes you' ? 'text-primary' :
                  selectedContact.relation === 'you owe' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {selectedContact.relation}
                </span>
                <span className="figure-lg">
                  {selectedContact.amount > 0 ? formatCurrency(selectedContact.amount) : '₹0'}
                </span>
              </div>

              {selectedContact.relation !== 'settled' && (
                <button
                  onClick={handleSettle}
                  className="w-full py-4 rounded-xl font-bold text-background bg-primary tracking-wide shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Mark Settled
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
