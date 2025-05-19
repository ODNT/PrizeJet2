import { CampaignLandingPage } from "@/components/campaigns/campaign-landing-page";

export default function CampaignPublicPage({ params }: { params: { slug: string } }) {
  return <CampaignLandingPage slug={params.slug} />;
}
