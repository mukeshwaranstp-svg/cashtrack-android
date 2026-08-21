import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { ScreenContainer } from '@/components/layout';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { CalculatorTool } from '@/components/tools/CalculatorTool';
import { NotesTool } from '@/components/tools/NotesTool';
import { ContactsTool } from '@/components/tools/ContactsTool';

export type ToolId = 'calculator' | 'notes' | 'contacts';

export function Tools() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  return (
    <ScreenContainer className="pt-6 px-4 sm:px-6 pb-28 gap-6 overflow-x-hidden relative">
      <AnimatePresence mode="wait" initial={false}>
        {activeTool === null ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full"
          >
            <div className="flex flex-col mb-6">
              <span className="label-caps text-primary mb-1">Tools</span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Toolkit</h1>
            </div>
            <ToolGrid onSelectTool={setActiveTool} />
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full"
          >
            <button
              onClick={() => setActiveTool(null)}
              className="flex items-center gap-1.5 self-start mb-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-wide">
                {activeTool === 'calculator' && 'Calculator'}
                {activeTool === 'notes' && 'Notes'}
                {activeTool === 'contacts' && 'Contacts'}
              </span>
            </button>

            {activeTool === 'calculator' && <CalculatorTool />}
            {activeTool === 'notes' && <NotesTool />}
            {activeTool === 'contacts' && <ContactsTool />}
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenContainer>
  );
}
