"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, MinusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const campaignFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  featured_image: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  prize_title: z.string().min(3, {
    message: "Prize title must be at least 3 characters.",
  }),
  prize_description: z.string().min(10, {
    message: "Prize description must be at least 10 characters.",
  }),
  num_winners: z.number().min(1).max(100),
  entry_options: z.object({
    email_opt_in: z.boolean().default(true),
    referral_enabled: z.boolean().default(true),
    bonus_actions: z.array(
      z.object({
        type: z.enum(["social_share", "visit_link", "custom"]),
        title: z.string(),
        points: z.number().min(1),
        link: z.string().optional(),
      })
    ).default([]),
  }),
  points_config: z.object({
    referral_points: z.number().min(1),
  }),
  pro_features: z.object({
    autoresponder_integration: z.object({
      enabled: z.boolean().default(false),
      provider: z.enum(["mailchimp", "convertkit", "none"]).default("none"),
      api_key: z.string().optional(),
      list_id: z.string().optional(),
    }),
    webhook_url: z.string().optional(),
  }),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export function CampaignForm({ id }: { id?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      featured_image: "",
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      prize_title: "",
      prize_description: "",
      num_winners: 1,
      entry_options: {
        email_opt_in: true,
        referral_enabled: true,
        bonus_actions: [],
      },
      points_config: {
        referral_points: 10,
      },
      pro_features: {
        autoresponder_integration: {
          enabled: false,
          provider: "none",
        },
        webhook_url: "",
      },
    },
  });

  useEffect(() => {
    async function checkProStatus() {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) return;

        // Check if user has pro subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.user.id)
          .eq("status", "active")
          .single();

        if (data) {
          setIsProUser(true);
        }
      } catch (error) {
        console.error("Error checking pro status:", error);
      }
    }

    async function fetchCampaign() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (data) {
          // Transform the data to match form structure
          form.reset({
            title: data.title,
            description: data.description,
            featured_image: data.featured_image,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
            prize_title: data.prize_title,
            prize_description: data.prize_description,
            num_winners: data.num_winners,
            entry_options: data.entry_options,
            points_config: data.points_config,
            pro_features: data.pro_features,
          });
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      }
    }

    checkProStatus();
    fetchCampaign();
  }, [id, form]);

  async function onSubmit(values: CampaignFormValues) {
    setIsSubmitting(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        router.push("/login");
        return;
      }

      // Check if user is trying to use pro features without pro subscription
      if (!isProUser && 
          (values.pro_features.autoresponder_integration.enabled || 
           values.pro_features.webhook_url)) {
        setShowProUpgrade(true);
        setIsSubmitting(false);
        return;
      }

      const campaignData = {
        ...values,
        user_id: user.user.id,
        status: "draft",
      };

      let result;
      
      if (id) {
        // Update existing campaign
        result = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", id);
      } else {
        // Create new campaign
        result = await supabase
          .from("campaigns")
          .insert(campaignData)
          .select();
      }

      if (result.error) throw result.error;
      
      // Redirect to campaign dashboard or details page
      if (id) {
        router.push(`/campaigns/${id}`);
      } else if (result.data && result.data[0]) {
        router.push(`/campaigns/${result.data[0].id}`);
      } else {
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProUpgrade() {
    // Redirect to Stripe checkout or subscription page
    router.push("/pricing");
  }

  function addBonusAction() {
    const currentActions = form.getValues("entry_options.bonus_actions") || [];
    form.setValue("entry_options.bonus_actions", [
      ...currentActions,
      { type: "social_share", title: "", points: 5, link: "" },
    ]);
  }

  function removeBonusAction(index: number) {
    const currentActions = form.getValues("entry_options.bonus_actions") || [];
    form.setValue(
      "entry_options.bonus_actions",
      currentActions.filter((_, i) => i !== index)
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prize">Prize Details</TabsTrigger>
            <TabsTrigger value="entry">Entry Options</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>
          
          {/* Basic Campaign Info */}
          <TabsContent value="basic" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign title" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be displayed as the main title of your campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your campaign"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about your campaign and what participants can expect.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="featured_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add a URL to an image that represents your campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When your campaign will start accepting entries.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("start_date");
                            return date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When your campaign will stop accepting entries.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Prize Details */}
          <TabsContent value="prize" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="prize_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter prize title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A short title for the prize you're giving away.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="prize_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the prize in detail"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed information about the prize, its value, and any terms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="num_winners"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Winners</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How many winners will be selected for this campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Entry Options */}
          <TabsContent value="entry" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Entry Methods</h3>
              
              <FormField
                control={form.control}
                name="entry_options.email_opt_in"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled // Always required
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Email Opt-in</FormLabel>
                      <FormDescription>
                        Participants must provide their email address to enter. (Required)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="entry_options.referral_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Referral-based Entry</FormLabel>
                      <FormDescription>
                        Allow participants to earn extra entries by referring others.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("entry_options.referral_enabled") && (
                <FormField
                  control={form.control}
                  name="points_config.referral_points"
                  render={({ field }) => (
                    <FormItem className="ml-7">
                      <FormLabel>Points per Referral</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many points a participant earns for each successful referral.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Bonus Actions</h3>
                <Button type="button" variant="outline" size="sm" onClick={addBonusAction}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
              
              <div className="space-y-4">
                {form.watch("entry_options.bonus_actions")?.map((_, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Bonus Action #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBonusAction(index)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`entry_options.bonus_actions.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="social_share" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Social Share
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="visit_link" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Visit Link
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="custom" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Custom Action
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`entry_options.bonus_actions.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Action Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Share on Twitter" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`entry_options.bonus_actions.${index}.points`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Points</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {form.watch(`entry_options.bonus_actions.${index}.type`) === "visit_link" && (
                        <FormField
                          control={form.control}
                          name={`entry_options.bonus_actions.${index}.link`}
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Link URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                The URL participants need to visit to earn points.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Integration</h3>
              
              <div className="rounded-md border p-4">
                <FormField
                  control={form.control}
                  name="pro_features.autoresponder_integration.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isProUser}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Connect Email Service
                          {!isProUser && (
                            <Badge className="ml-2" variant="outline">
                              Pro
                            </Badge>
                          )}
                        </FormLabel>
                        <FormDescription>
                          Automatically send new entries to your email marketing service.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch("pro_features.autoresponder_integration.enabled") && (
                  <div className="mt-4 space-y-4 pl-7">
                    <FormField
                      control={form.control}
                      name="pro_features.autoresponder_integration.provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Provider</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="mailchimp" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Mailchimp
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="convertkit" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  ConvertKit
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pro_features.autoresponder_integration.api_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter API key" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your API key from the selected email provider.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pro_features.autoresponder_integration.list_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>List ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter list ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            The ID of the list or audience where entries will be added.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Webhook Integration</h3>
              
              <div className="rounded-md border p-4">
                <FormField
                  control={form.control}
                  name="pro_features.webhook_url"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>
                          Webhook URL
                          {!isProUser && (
                            <Badge className="ml-2" variant="outline">
                              Pro
                            </Badge>
                          )}
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/webhook"
                          {...field}
                          disabled={!isProUser}
                        />
                      </FormControl>
                      <FormDescription>
                        Receive real-time notifications when new entries are submitted.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {!isProUser && (
              <div className="rounded-md border p-4 bg-muted/50">
                <h3 className="text-lg font-medium mb-2">Upgrade to Pro</h3>
                <p className="text-muted-foreground mb-4">
                  Unlock advanced features like email integration, webhooks, and more with PrizeJet Pro.
                </p>
                <Button type="button" onClick={handleProUpgrade}>
                  Upgrade Now
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {showProUpgrade && (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertDescription className="flex flex-col space-y-4">
              <p>
                Some of the features you've enabled require a Pro subscription. Upgrade to Pro to use these features.
              </p>
              <Button type="button" onClick={handleProUpgrade}>
                Upgrade to Pro
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/campaigns")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : id ? "Update Campaign" : "Create Campaign"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
