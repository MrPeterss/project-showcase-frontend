import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NavBar() {
  const location = useLocation();

  // Determine current tab based on pathname
  const currentTab = location.pathname === '/projects' ? 'projects' : 'myteam';

  return (
    <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <Tabs value={currentTab}>
          <TabsList className="h-12">
            <TabsTrigger value="myteam" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </TabsTrigger>
            <TabsTrigger value="projects" asChild>
              <Link to="/projects">Projects</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
