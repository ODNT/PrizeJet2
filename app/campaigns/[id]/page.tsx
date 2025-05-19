import { CampaignDetails } from "@/components/campaigns/campaign-details";

export default function CampaignPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <CampaignDetails id={params.id} />
    </div>
  );
}
