import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { teams } from "@/services/dummyData"
import { Link } from "react-router-dom"

const formatWhen = (iso: string) => new Date(iso).toLocaleString()

export function Projects() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Header row */}
        <div className="hidden grid-cols-[80px_1fr_140px_220px_100px] gap-3 px-2 text-sm opacity-60 md:grid">
          <div className="text-left">ID</div>
          <div className="text-left">Team</div>
          <div className="text-left">Members</div>
          <div className="text-left">Last Updated</div>
          <div className="text-right">Action</div>
        </div>

        <div className="divide-y">
          {teams.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[80px_1fr_140px_220px_100px] md:items-center md:gap-3 md:py-2"
            >
              {/* ID */}
              <div className="font-mono text-sm text-left opacity-80">{t.id}</div>

              {/* Team name (link) */}
              <div className="flex items-center justify-between md:block">
                <Link
                  to={t.link}
                  className="font-medium text-primary text-left underline-offset-4 hover:underline"
                >
                  {t.name}
                </Link>
              </div>

              {/* Members */}
              <div className="text-sm text-left md:text-base md:opacity-90">
                {t.memberCount}
              </div>

              {/* Last updated */}
              <div className="text-sm text-left opacity-80">{formatWhen(t.lastUpdated)}</div>

              {/* Action */}
              <div className="text-right">
                <Button asChild size="sm" variant="secondary">
                  <Link to={t.link}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
