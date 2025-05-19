"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Facebook, Twitter, Mail, Share2, Clock, Award, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

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
};

type Entry = {
  id: string;
  referral_code: string;
};

export function CampaignLandingPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        // Check for referral code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get("ref");
        if (ref) {
          setReferralCode(ref);
          // Store referral code in localStorage
          localStorage.setItem(`prizejet_ref_${slug}`, ref);
        } else {
          // Check if we have a stored referral code
          const storedRef = localStorage.getItem(`prizejet_ref_${slug}`);
          if (storedRef) {
            setReferralCode(storedRef);
          }
        }

        // Fetch campaign data
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("slug", slug)
          .eq("status", "active")
          .single();

        if (error) throw error;
        
        if (!data) {
          router.push("/");
          return;
        }
        
        setCampaign(data);

        // Check if user has already entered
        const entryId = localStorage.getItem(`prizejet_entry_${data.id}`);
        if (entryId) {
          const { data: entryData, error: entryError } = await supabase
            .from("campaign_entries")
            .select("id, referral_code")
            .eq("id", entryId)
            .single();

          if (!entryError && entryData) {
            setEntry(entryData);
            setSuccess(true);
          }
        }

        // Get total entries count
        const { count } = await supabase
          .from("campaign_entries")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", data.id);

        setTotalEntries(count || 0);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setError("Campaign not found or no longer active.");
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [slug, router]);

  useEffect(() => {
    if (!campaign) return;

    const endDate = new Date(campaign.end_date);
    
    const timer = setInterval(() => {
      const now = new Date();
      
      if (now >= endDate) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      
      setTimeLeft({
        days: differenceInDays(endDate, now),
        hours: differenceInHours(endDate, now) % 24,
        minutes: differenceInMinutes(endDate, now) % 60,
        seconds: differenceInSeconds(endDate, now) % 60
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [campaign]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!campaign) return;
    
    setSubmitting(true);
    setError("");
    
    try {
      // Basic validation
      if (!email.trim() || !name.trim()) {
        setError("Please provide both your name and email.");
        return;
      }
      
      // Check if email already exists for this campaign
      const { count } = await supabase
        .from("campaign_entries")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("email", email.trim().toLowerCase());
      
      if (count && count > 0) {
        setError("This email has already been used to enter this campaign.");
        return;
      }
      
      // Find referrer if referral code is provided
      let referrerId = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from("campaign_entries")
          .select("id")
          .eq("referral_code", referralCode)
          .single();
        
        if (referrer) {
          referrerId = referrer.id;
        }
      }
      
      // Generate unique referral code
      const newReferralCode = Math.random().toString(36).substring(2, 10);
      
      // Calculate initial points
      let points = 1; // Base points for entering
      
      // Insert entry
      const { data: newEntry, error } = await supabase
        .from("campaign_entries")
        .insert({
          campaign_id: campaign.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          referral_code: newReferralCode,
          referrer_id: referrerId,
          points: points,
          ip_address: "client-side", // We can't get real IP on client side
          bonus_actions_completed: []
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (newEntry) {
        // Store entry ID in localStorage
        localStorage.setItem(`prizejet_entry_${campaign.id}`, newEntry.id);
        
        // If there was a referrer, update their points
        if (referrerId && campaign.entry_options.referral_enabled) {
          await supabase.rpc('increment_points', { 
            entry_id: referrerId, 
            points_to_add: campaign.points_config.referral_points 
          });
        }
        
        setEntry(newEntry);
        setSuccess(true);
        
        // Update total entries count
        setTotalEntries(totalEntries + 1);
      }
    } catch (error) {
      console.error("Error submitting entry:", error);
      setError("There was an error submitting your entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBonusAction(action: { type: string; title: string; link?: string }) {
    if (!campaign || !entry) return;
    
    // For visit link actions, open the link in a new tab
    if (action.type === "visit_link" && action.link) {
      window.open(action.link, "_blank");
    }
    
    // For social share actions, open the appropriate share dialog
    if (action.type === "social_share") {
      const shareUrl = `${window.location.origin}/c/${slug}?ref=${entry.referral_code}`;
      const shareText = `Join me in the ${campaign.title} giveaway to win ${campaign.prize_title}!`;
      
      if (action.title.toLowerCase().includes("facebook")) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank");
      } else if (action.title.toLowerCase().includes("twitter") || action.title.toLowerCase().includes("x")) {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (action.title.toLowerCase().includes("email")) {
        window.open(`mailto:?subject=${encodeURIComponent(`Join the ${campaign.title} giveaway`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, "_blank");
      }
    }
    
    // In a real implementation, we would track bonus action completion here
    // and update the user's points accordingly
  }

  function copyReferralLink() {
    if (!entry) return;
    
    const referralUrl = `${window.location.origin}/c/${slug}?ref=${entry.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    
    // Show a temporary "Copied!" message
    const button = document.getElementById("copy-button");
    if (button) {
      const originalText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Campaign...</h2>
          <p className="text-muted-foreground">Please wait while we load the campaign details.</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or is no longer active.</p>
          <Button asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  const isEnded = new Date() > new Date(campaign.end_date);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">PrizeJet</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{campaign.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{campaign.description}</p>
            
            {/* Countdown Timer */}
            {!isEnded && timeLeft && (
              <div className="inline-flex items-center bg-muted rounded-lg p-2 mb-6">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">
                  {timeLeft.days > 0 && `${timeLeft.days}d `}
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="ml-2 text-muted-foreground">remaining</span>
              </div>
            )}
            
            {isEnded && (
              <div className="inline-flex items-center bg-destructive/10 text-destructive rounded-lg p-2 mb-6">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">This campaign has ended</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {/* Prize Info */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Prize Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaign.featured_image && (
                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        <img 
                          src={campaign.featured_image} 
                          alt={campaign.prize_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-bold">{campaign.prize_title}</h3>
                    <p>{campaign.prize_description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{campaign.num_winners} winner{campaign.num_winners > 1 ? 's' : ''} will be selected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Entry Form or Referral Info */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {success ? "You're In!" : "Enter to Win"}
                  </CardTitle>
                  <CardDescription>
                    {success 
                      ? "Share with friends to increase your chances of winning!" 
                      : "Fill out the form below to enter the giveaway."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={submitting || isEnded}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={submitting || isEnded}
                        />
                      </div>
                      
                      {referralCode && (
                        <div className="text-sm text-muted-foreground">
                          You were referred by a friend!
                        </div>
                      )}
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={submitting || isEnded}
                      >
                        {submitting ? "Submitting..." : isEnded ? "Campaign Ended" : "Enter Now"}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <Alert>
                        <AlertDescription>
                          Thanks for entering! Share your unique link with friends to earn more entries.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label>Your Referral Link</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={`${window.location.origin}/c/${slug}?ref=${entry?.referral_code}`}
                            readOnly
                          />
                          <Button id="copy-button" onClick={copyReferralLink} variant="outline">
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Earn {campaign.points_config.referral_points} points for each friend who enters using your link!
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Share on Social Media</Label>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleBonusAction({ 
                              type: "social_share", 
                              title: "Share on Facebook" 
                            })}
                          >
                            <Facebook className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleBonusAction({ 
                              type: "social_share", 
                              title: "Share on Twitter" 
                            })}
                          >
                            <Twitter className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleBonusAction({ 
                              type: "social_share", 
                              title: "Share via Email" 
                            })}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              {/* Campaign Stats */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Entries</div>
                      <div className="text-2xl font-bold">{totalEntries}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div>{format(new Date(campaign.start_date), "MMMM d, yyyy")}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div>{format(new Date(campaign.end_date), "MMMM d, yyyy")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Bonus Actions */}
              {success && campaign.entry_options.bonus_actions && campaign.entry_options.bonus_actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bonus Actions</CardTitle>
                    <CardDescription>Complete these actions to earn more entries!</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaign.entry_options.bonus_actions.map((action, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{action.title}</div>
                            <div className="text-sm text-muted-foreground">+{action.points} points</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBonusAction(action)}
                          >
                            {action.type === "visit_link" ? "Visit" : 
                             action.type === "social_share" ? "Share" : "Complete"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PrizeJet. All rights reserved.</p>
          <div className="mt-2">
            <a href="/terms" className="hover:underline mx-2">Terms</a>
            <a href="/privacy" className="hover:underline mx-2">Privacy</a>
            <a href="/contact" className="hover:underline mx-2">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
