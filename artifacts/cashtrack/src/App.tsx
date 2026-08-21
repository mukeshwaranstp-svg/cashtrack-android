import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalLayout } from '@/components/layout';
import { Home } from '@/pages/Home';
import { Analysis } from '@/pages/Analysis';
import { Tools } from '@/pages/Tools';
import { Settings } from '@/pages/Settings';
import type { Screen } from '@/types';

const queryClient = new QueryClient();

/**
 * Screen switching is plain React state -- no router. Each screen is a
 * placeholder for now; content is built out screen by screen.
 */
function ActiveScreen({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'home':
      return <Home />;
    case 'analysis':
      return <Analysis />;
    case 'tools':
      return <Tools />;
    case 'settings':
      return <Settings />;
  }
}

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalLayout activeScreen={activeScreen} onNavigate={setActiveScreen}>
          <ActiveScreen screen={activeScreen} />
        </GlobalLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
