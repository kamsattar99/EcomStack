import { useEffect } from "react";
import { useGetAdminSettings, useUpdateSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Store, Link as LinkIcon, Settings2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const settingsSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  supportEmail: z.string().email("Invalid email"),
  offerTitle: z.string().min(1, "Offer title is required"),
  offerDescription: z.string().min(1, "Description is required"),
  eligibility: z.string().min(1, "Eligibility text is required"),
  affiliateDisclosure: z.string().min(1, "Disclosure is required"),
  affiliateUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  campaignId: z.string().optional(),
  eventTrackerId: z.string().optional(),
  outboundParameter: z.enum(["subId1", "subId2", "subId3", "sharedId"]),
  returnedField: z.enum(["SubId1", "SubId2", "SubId3", "SharedId"]),
  acceptedStates: z.array(z.enum(["PENDING", "APPROVED"])).min(1, "Select at least one accepted state"),
  syncIntervalMinutes: z.number().min(15).max(1440),
  affiliateReady: z.boolean(),
  verificationEnabled: z.boolean(),
  development: z.boolean(),
  trackingConfirmed: z.boolean(),
  incentiveApproved: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      brandName: "", tagline: "", logoUrl: "", supportEmail: "",
      offerTitle: "", offerDescription: "", eligibility: "", affiliateDisclosure: "",
      affiliateUrl: "", campaignId: "", eventTrackerId: "",
      outboundParameter: "subId1", returnedField: "SubId1",
      acceptedStates: ["APPROVED"], syncIntervalMinutes: 60,
      affiliateReady: false, verificationEnabled: false, development: false,
      trackingConfirmed: false, incentiveApproved: false,
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        brandName: settings.brandName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl || "",
        supportEmail: settings.supportEmail,
        offerTitle: settings.offerTitle,
        offerDescription: settings.offerDescription,
        eligibility: settings.eligibility,
        affiliateDisclosure: settings.affiliateDisclosure,
        affiliateUrl: settings.affiliateUrl || "",
        campaignId: settings.campaignId || "",
        eventTrackerId: settings.eventTrackerId || "",
        outboundParameter: settings.outboundParameter,
        returnedField: settings.returnedField,
        acceptedStates: settings.acceptedStates,
        syncIntervalMinutes: settings.syncIntervalMinutes,
        affiliateReady: settings.affiliateReady,
        verificationEnabled: settings.verificationEnabled,
        development: settings.development,
        trackingConfirmed: settings.trackingConfirmed,
        incentiveApproved: settings.incentiveApproved,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate({ data }, {
      onSuccess: (res) => {
        toast({ title: "Settings updated successfully" });
        queryClient.setQueryData(getGetAdminSettingsQueryKey(), res);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to update settings" });
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure brand, offer details, and Impact affiliate integration.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30">
              <CardTitle className="font-serif flex items-center text-lg">
                <Store className="h-5 w-5 mr-2 text-primary" /> Brand & Display
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="brandName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supportEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email</FormLabel>
                    <FormControl><Input {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="tagline" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="logoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30">
              <CardTitle className="font-serif flex items-center text-lg">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" /> Offer Configuration
              </CardTitle>
              <CardDescription>What users see on the Unlock page.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField control={form.control} name="offerTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Button Text</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Start Free Shopify Trial" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="offerDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Headline</FormLabel>
                  <FormControl><Textarea {...field} className="h-20 resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="eligibility" render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Requirements</FormLabel>
                  <FormControl><Textarea {...field} className="h-20 resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="affiliateDisclosure" render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliate Disclosure</FormLabel>
                  <FormDescription>FTC required disclosure text.</FormDescription>
                  <FormControl><Textarea {...field} className="h-20 resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader className="border-b border-border bg-primary/5">
              <CardTitle className="font-serif flex items-center text-lg">
                <LinkIcon className="h-5 w-5 mr-2 text-primary" /> Impact Affiliate Integration
              </CardTitle>
              <CardDescription>Configure the connection to Impact.com for verification tracking.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-lg text-sm mb-6">
                <strong>Important:</strong> Impact tracking must be approved for incent/cashback before enabling, and you must pass the tracking ID in the configured Outbound Parameter.
              </div>

              <FormField control={form.control} name="affiliateUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Link (Affiliate URL)</FormLabel>
                  <FormDescription>Must include the parameter configured below (e.g. ?subId1=).</FormDescription>
                  <FormControl><Input {...field} placeholder="https://impact.com/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="campaignId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="eventTrackerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Tracker ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="outboundParameter" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outbound Parameter (Link)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="subId1">subId1</SelectItem>
                        <SelectItem value="subId2">subId2</SelectItem>
                        <SelectItem value="subId3">subId3</SelectItem>
                        <SelectItem value="sharedId">sharedId</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="returnedField" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Returned Field (API)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="SubId1">SubId1</SelectItem>
                        <SelectItem value="SubId2">SubId2</SelectItem>
                        <SelectItem value="SubId3">SubId3</SelectItem>
                        <SelectItem value="SharedId">SharedId</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="acceptedStates" render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Accepted Conversion States</FormLabel>
                    <FormDescription>Which Impact states grant access to the vault?</FormDescription>
                  </div>
                  <div className="flex flex-row space-x-6">
                    <FormField control={form.control} name="acceptedStates" render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("PENDING")}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, "PENDING"])
                                  : field.onChange(field.value?.filter((value) => value !== "PENDING"))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">PENDING</FormLabel>
                        </FormItem>
                      )
                    }} />
                    <FormField control={form.control} name="acceptedStates" render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("APPROVED")}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, "APPROVED"])
                                  : field.onChange(field.value?.filter((value) => value !== "APPROVED"))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">APPROVED</FormLabel>
                        </FormItem>
                      )
                    }} />
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-4 pt-4 border-t border-border">
                <FormField control={form.control} name="trackingConfirmed" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I confirm tracking parameters are correctly configured on the affiliate link.</FormLabel>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="incentiveApproved" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I confirm this campaign is approved for incentive/cashback traffic in Impact.</FormLabel>
                    </div>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30">
              <CardTitle className="font-serif flex items-center text-lg">
                <Settings2 className="h-5 w-5 mr-2 text-primary" /> System Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="syncIntervalMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Sync Interval (Minutes)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border">
                <FormField control={form.control} name="affiliateReady" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Affiliate Ready</FormLabel>
                      <FormDescription>Enable link on frontend.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="verificationEnabled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Verification</FormLabel>
                      <FormDescription>Allow users to verify.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="development" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Development Mode</FormLabel>
                      <FormDescription>Skip API calls.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="rounded-full shadow-sm px-8" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
