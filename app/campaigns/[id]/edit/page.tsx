import { CampaignForm } from "@/components/campaigns/campaign-form";

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Edit Campaign</h1>
      <CampaignForm id={params.id} />
    </div>
  );
}
