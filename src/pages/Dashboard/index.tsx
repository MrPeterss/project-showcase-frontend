import DashboardMainSection from './DashboardMainSection.tsx';
import DashboardSideBarSection from './DashboardSideBarSection.tsx';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardMainSection />
      <DashboardSideBarSection />
    </div>
  );
}
