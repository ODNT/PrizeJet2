import { CampaignDashboard } from "@/components/campaigns/campaign-dashboard";

export default function CampaignDashboardPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <CampaignDashboard id={params.id} />
    </div>
  );
}
