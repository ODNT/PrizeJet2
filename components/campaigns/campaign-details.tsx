
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Calendar, Award, Users, Link as LinkIcon, Copy, ExternalLink } from "lucide-react";
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