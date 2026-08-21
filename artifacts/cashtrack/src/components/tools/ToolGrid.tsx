import { motion } from 'framer-motion';
import { Calculator, StickyNote, Users, Sparkles } from 'lucide-react';
import type { ToolId } from '@/pages/Tools';

interface ToolGridProps {
  onSelectTool: (id: ToolId) => void;
}

export function ToolGrid({ onSelectTool }: ToolGridProps) {
  const tools: { id: ToolId; name: string; desc: string; icon: any }[] = [
    { id: 'calculator', name: 'Calculator', desc: 'Crunch the numbers', icon: Calculator },
    { id: 'notes', name: 'Notes', desc: 'Jot down ideas', icon: StickyNote },
    { id: 'contacts', name: 'Contacts', desc: 'Who owes who', icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <motion.button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center justify-center p-6 rounded-[16px] bg-card border border-border shadow-sm text-center"
          >
            <Icon className="w-8 h-8 mb-4 text-primary" strokeWidth={1.5} />
            <span className="font-bold text-foreground text-sm tracking-wide mb-1">{tool.name}</span>
            <span className="text-muted-foreground text-xs">{tool.desc}</span>
          </motion.button>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tools.length * 0.05, duration: 0.2 }}
        className="col-span-2 flex flex-col items-center justify-center p-5 rounded-[16px] bg-card/50 border border-border/50 shadow-sm text-center cursor-default"
      >
        <Sparkles className="w-6 h-6 mb-3 text-muted-foreground/50" strokeWidth={1.5} />
        <span className="font-bold text-muted-foreground text-sm tracking-wide mb-1">More tools coming soon</span>
        <span className="text-muted-foreground/60 text-xs">We're building more for you</span>
      </motion.div>
    </div>
  );
}
