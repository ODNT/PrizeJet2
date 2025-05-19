"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Download, Link as LinkIcon, Copy, Users, Award, Share2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from "recharts";

type Campaign = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "ended";
  entries_count: number;
  created_at: string;
  slug: string;
  prize_title: string;
  prize_description: string;
  featured_image: string;
};

type Entry = {
  id: string;
  email: string;
  name: string;
  referral_code: string;
  referrer_id: string | null;
  points: number;
  created_at: string;
  ip_address: string;
  bonus_actions_completed: string[];
};

type DailyStats = {
  date: string;
  entries: number;
  referrals: number;
};

export function CampaignDashboard({ id }: { id: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topReferrers, setTopReferrers] = useState<{ name: string; email: string; referrals: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [campaignUrl, setCampaignUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          router.push("/login");
          return;
        }

        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.user.id)
          .single();

        if (campaignError) throw campaignError;
        
        if (!campaignData) {
          router.push("/campaigns");
          return;
        }
        
        setCampaign(campaignData);
        setCampaignUrl(`${window.location.origin}/c/${campaignData.slug}`);

        // Fetch entries
        const { data: entriesData, error: entriesError } = await supabase
          .from("campaign_entries")
          .select("*")
          .eq("campaign_id", id)
          .order("created_at", { ascending: false });

        if (entriesError) throw entriesError;
        
        setEntries(entriesData || []);
        setFilteredEntries(entriesData || []);

        // Generate daily stats
        const stats = generateDailyStats(entriesData || []);
        setDailyStats(stats);

        // Calculate top referrers
        const referrers = calculateTopReferrers(entriesData || []);
        setTopReferrers(referrers);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [id, router]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(
        entry => 
          entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchTerm, entries]);

  function generateDailyStats(entries: Entry[]): DailyStats[] {
    const stats: Record<string, { entries: number; referrals: number }> = {};
    
    // Initialize with the last 14 days
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");
      stats[dateStr] = { entries: 0, referrals: 0 };
    }
    
    // Count entries and referrals by date
    entries.forEach(entry => {
      const dateStr = format(new Date(entry.created_at), "yyyy-MM-dd");
      
      if (!stats[dateStr]) {
        stats[dateStr] = { entries: 0, referrals: 0 };
      }
      
      stats[dateStr].entries += 1;
      
      if (entry.referrer_id) {
        stats[dateStr].referrals += 1;
      }
    });
    
    // Convert to array format for charts
    return Object.keys(stats).sort().map(date => ({
      date: format(new Date(date), "MMM dd"),
      entries: stats[date].entries,
      referrals: stats[date].referrals
    }));
  }

  function calculateTopReferrers(entries: Entry[]): { name: string; email: string; referrals: number }[] {
    const referrerCounts: Record<string, { name: string; email: string; count: number }> = {};
    
    // Count referrals for each entry
    entries.forEach(entry => {
      if (entry.referral_code) {
        const referrals = entries.filter(e => e.referrer_id === entry.id);
        
        referrerCounts[entry.id] = {
          name: entry.name,
          email: entry.email,
          count: referrals.length
        };
      }
    });
    
    // Convert to array and sort by count
    return Object.values(referrerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        email: item.email,
        referrals: item.count
      }));
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportEntries() {
    // Create CSV content
    const headers = ["Name", "Email", "Points", "Referrer", "Date Joined", "IP Address"];
    const csvContent = [
      headers.join(","),
      ...entries.map(entry => [
        `"${entry.name}"`,
        `"${entry.email}"`,
        entry.points,
        entry.referrer_id ? "Yes" : "No",
        format(new Date(entry.created_at), "yyyy-MM-dd HH:mm:ss"),
        entry.ip_address
      ].join(","))
    ].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${campaign?.title.replace(/\s+/g, "_")}_entries.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return <div className="text-center py-10">Loading campaign data...</div>;
  }

  if (!campaign) {
    return <div className="text-center py-10">Campaign not found.</div>;
  }

  const totalEntries = entries.length;
  const directEntries = entries.filter(entry => !entry.referrer_id).length;
  const referralEntries = entries.filter(entry => entry.referrer_id).length;
  const referralRate = totalEntries > 0 ? (referralEntries / totalEntries) * 100 : 0;

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
            <span className="text-muted-foreground ml-4">
              {format(new Date(campaign.start_date), "MMM d, yyyy")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/campaigns/${id}/edit`}>Edit Campaign</Link>
          </Button>
          <Button asChild>
            <Link href={campaignUrl} target="_blank">View Landing Page</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            <CardDescription className="text-3xl font-bold text-foreground">{totalEntries}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {totalEntries > 0 ? `${directEntries} direct, ${referralEntries} from referrals` : "No entries yet"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Referral Rate</CardTitle>
            <CardDescription className="text-3xl font-bold text-foreground">{referralRate.toFixed(1)}%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {referralEntries} entries came from referrals
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaign URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input value={campaignUrl} readOnly className="text-xs" />
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? "Copied!" : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prize</CardTitle>
            <CardDescription className="text-xl font-bold text-foreground">{campaign.prize_title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {campaign.num_winners} winner{campaign.num_winners > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Entries</CardTitle>
                <CardDescription>Number of entries over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ChartContainer config={{
                  entries: { theme: { light: 'hsl(var(--chart-1))', dark: 'hsl(var(--chart-1))' } },
                  referrals: { theme: { light: 'hsl(var(--chart-2))', dark: 'hsl(var(--chart-2))' } },
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="entries" stroke="var(--color-entries)" strokeWidth={2} name="Total Entries" />
                      <Line type="monotone" dataKey="referrals" stroke="var(--color-referrals)" strokeWidth={2} name="Referrals" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entry Sources</CardTitle>
                <CardDescription>Direct vs referral entries</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ChartContainer config={{
                  direct: { theme: { light: 'hsl(var(--chart-3))', dark: 'hsl(var(--chart-3))' } },
                  referral: { theme: { light: 'hsl(var(--chart-4))', dark: 'hsl(var(--chart-4))' } },
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Entry Sources', direct: directEntries, referral: referralEntries }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="direct" fill="var(--color-direct)" name="Direct Entries" />
                      <Bar dataKey="referral" fill="var(--color-referral)" name="Referral Entries" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Referrers</CardTitle>
              <CardDescription>Participants who brought in the most referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {topReferrers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Referrals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topReferrers.map((referrer, index) => (
                      <TableRow key={index}>
                        <TableCell>{referrer.name}</TableCell>
                        <TableCell>{referrer.email}</TableCell>
                        <TableCell className="text-right">{referrer.referrals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No referrals yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="entries" className="space-y-6 pt-4">
          <div className="flex justify-between items-center">
            <div className="w-full max-w-sm">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={exportEntries}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {filteredEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>{entry.email}</TableCell>
                        <TableCell>{entry.points}</TableCell>
                        <TableCell>
                          {entry.referrer_id ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Referral
                            </Badge>
                          ) : (
                            <Badge variant="outline">Direct</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(entry.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  {entries.length > 0 ? "No entries match your search." : "No entries yet."}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leaderboard</CardTitle>
              <CardDescription>Participants ranked by points</CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Bonus Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 20)
                      .map((entry, index) => {
                        const referrals = entries.filter(e => e.referrer_id === entry.id).length;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{entry.name}</TableCell>
                            <TableCell>{entry.points}</TableCell>
                            <TableCell>{referrals}</TableCell>
                            <TableCell>{entry.bonus_actions_completed?.length || 0}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No entries yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <ChartTooltipContent>
      <div className="font-medium">{label}</div>
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <div 
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <span className="font-mono font-medium">{item.value}</span>
        </div>
      ))}
    </ChartTooltipContent>
  );
}
