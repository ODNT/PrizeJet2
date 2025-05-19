import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CampaignList } from "@/components/campaigns/campaign-list";

export default function CampaignsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/create">Create Campaign</Link>
        </Button>
      </div>
      
      <CampaignList />
    </div>
  );
}
