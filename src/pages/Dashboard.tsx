import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { teams } from "@/services/dummyData"

export function Dashboard() {
  const team = teams[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>MyTeam — {team.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div><span className="opacity-70">Team ID:</span> {team.id}</div>
        <div><span className="opacity-70">Members:</span> {team.memberCount}</div>
        <div><span className="opacity-70">Last updated:</span> {new Date(team.lastUpdated).toLocaleString()}</div>
        <div><a className="text-primary underline underline-offset-4" href={team.link}>Open team</a></div>
      </CardContent>
    </Card>
  )
}
