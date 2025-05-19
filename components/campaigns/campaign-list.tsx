"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

type Campaign = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "ended";
  entries_count: number;
  created_at: string;
};

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        setCampaigns(data || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading your campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-4">You haven't created any campaigns yet</h3>
        <p className="text-muted-foreground mb-6">Create your first campaign to start collecting entries and referrals.</p>
        <Button asChild>
          <Link href="/campaigns/create">Create Your First Campaign</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{campaign.title}</CardTitle>
              <StatusBadge status={campaign.status} />
            </div>
            <CardDescription>{campaign.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entries:</span>
                <span className="font-medium">{campaign.entries_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${campaign.id}/edit`}>Edit</Link>
            </Button>
            <Button asChild>
              <Link href={`/campaigns/${campaign.id}/dashboard`}>Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "active" | "ended" }) {
  const variants = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  const labels = {
    draft: "Draft",
    active: "Active",
    ended: "Ended",
  };

  return (
    <Badge className={variants[status]} variant="outline">
      {labels[status]}
    </Badge>
  );
}
