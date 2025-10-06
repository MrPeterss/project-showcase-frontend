import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dashboard } from "../pages/Dashboard"
import { Projects } from "../pages/Projects"

export function NavBar() {
  const [tab, setTab] = useState<"myteam" | "projects">("myteam")

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="h-12">
              <TabsTrigger value="myteam">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={tab}>
          <TabsContent value="myteam" className="m-0">
            <Dashboard />
          </TabsContent>
          <TabsContent value="projects" className="m-0">
            <Projects />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
