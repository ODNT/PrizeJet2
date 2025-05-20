"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Calendar, Award, Users, Link as LinkIcon, Copy, ExternalLink, Check, BarChart } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

type Campaign = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "ended";
  prize_title: string;
  prize_description: string;
  featured_image: string;
  slug: string;
  num_winners: number;
  entry_options: {
    email_opt_in: boolean;
    referral_enabled: boolean;
    bonus_actions: {
      type: "social_share" | "visit_link" | "custom";
      title: string;
      points: number;
      link?: string;
    }[];
  };
  points_config: {
    referral_points: number;
  };
  pro_features: {
    autoresponder_integration: {
      enabled: boolean;
      provider: string;
    };
    webhook_url?: string;
  };
};

export function CampaignDetails({ id }: { id: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaignUrl, setCampaignUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.user.id)
          .single();

        if (error) throw error;
        
        if (!data) {
          router.push("/campaigns");
          return;
        }
        
        setCampaign(data);
        setCampaignUrl(`${window.location.origin}/c/${data.slug}`);
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [id, router]);

  async function publishCampaign() {
    if (!campaign) return;
    
    setPublishLoading(true);
    
    try {
      // Generate a slug if one doesn't exist
      let slug = campaign.slug;
      if (!slug) {
        slug = campaign.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
          + '-' + Math.random().toString(36).substring(2, 7);
      }
      
      const { error } = await supabase
        .from("campaigns")
        .update({ 
          status: "active",
          slug: slug
        })
        .eq("id", campaign.id);
      
      if (error) throw error;
      
      // Update local state
      setCampaign({
        ...campaign,
        status: "active",
        slug: slug
      });
      
      setCampaignUrl(`${window.location.origin}/c/${slug}`);
    } catch (error) {
      console.error("Error publishing campaign:", error);
    } finally {
      setPublishLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="text-center py-10">Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className="text-center py-10">Campaign not found.</div>;
  }

  const isPublished = campaign.status === "active" || campaign.status === "ended";
  const isEnded = campaign.status === "ended" || new Date() > new Date(campaign.end_date);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/campaigns">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Campaigns
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <div className="flex items-center mt-2">
            <Badge className={
              campaign.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
              campaign.status === "draft" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isPublished ? (
            <Button onClick={publishCampaign} disabled={publishLoading}>
              {publishLoading ? "Publishing..." : "Publish Campaign"}
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/campaigns/${id}/dashboard`}>View Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href={campaignUrl} target="_blank">
                  View Landing Page
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Overview of your campaign settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Prize</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Title:</span> {campaign.prize_title}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {campaign.prize_description}
                    </div>
                    <div>
                      <span className="font-medium">Winners:</span> {campaign.num_winners}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Dates</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Start Date:</span> {format(new Date(campaign.start_date), "MMMM d, yyyy")}
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span> {format(new Date(campaign.end_date), "MMMM d, yyyy")}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {isEnded ? "Ended" : campaign.status === "active" ? "Active" : "Draft"}
                    </div>
                  </div>
                </div>
              </div>
              
              {campaign.featured_image && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Featured Image</h3>
                  <div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <img 
                      src={campaign.featured_image} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium mb-2">Entry Options</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Email Opt-in:</span> {campaign.entry_options.email_opt_in ? "Enabled" : "Disabled"}
                  </div>
                  <div>
                    <span className="font-medium">Referral System:</span> {campaign.entry_options.referral_enabled ? "Enabled" : "Disabled"}
                  </div>
                  {campaign.entry_options.referral_enabled && (
                    <div>
                      <span className="font-medium">Points per Referral:</span> {campaign.points_config.referral_points}
                    </div>
                  )}
                </div>
              </div>
              
              {campaign.entry_options.bonus_actions && campaign.entry_options.bonus_actions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Bonus Actions</h3>
                  <div className="space-y-2">
                    {campaign.entry_options.bonus_actions.map((action, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.type === "social_share" ? "Social Share" : 
                             action.type === "visit_link" ? "Visit Link" : "Custom Action"}
                          </div>
                        </div>
                        <div className="text-sm">
                          +{action.points} points
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(campaign.pro_features.autoresponder_integration.enabled || campaign.pro_features.webhook_url) && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Pro Features</h3>
                  <div className="space-y-2">
                    {campaign.pro_features.autoresponder_integration.enabled && (
                      <div>
                        <span className="font-medium">Email Integration:</span> {campaign.pro_features.autoresponder_integration.provider}
                      </div>
                    )}
                    {campaign.pro_features.webhook_url && (
                      <div>
                        <span className="font-medium">Webhook URL:</span> {campaign.pro_features.webhook_url}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" asChild>
                <Link href={`/campaigns/${id}/edit`}>Edit Campaign</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Campaign URL</CardTitle>
              <CardDescription>
                {isPublished 
                  ? "Share this URL with your audience" 
                  : "Publish your campaign to get a shareable URL"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPublished ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={campaignUrl}
                      readOnly
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" asChild>
                      <Link href={campaignUrl} target="_blank" className="flex items-center justify-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Landing Page
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <Link href={`/campaigns/${id}/dashboard`} className="flex items-center justify-center">
                        <BarChart className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Your campaign URL will be generated when you publish your campaign.
                  </p>
                  <Button onClick={publishCampaign} disabled={publishLoading}>
                    {publishLoading ? "Publishing..." : "Publish Now"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/campaigns/${id}/edit`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Link>
              </Button>
              
              {isPublished && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/campaigns/${id}/dashboard`}>
                    <BarChart className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/campaigns/create">
                  <Award className="h-4 w-4 mr-2" />
                  Create New Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
