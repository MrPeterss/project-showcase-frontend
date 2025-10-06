import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Projects() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm opacity-80">Project list will go here.</p>
        <Button>Create Project</Button>
      </CardContent>
    </Card>
  )
}
