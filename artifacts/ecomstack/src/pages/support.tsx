import { useCreateSupportRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageMeta } from "@/components/page-meta";

const supportSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Please provide more details in your message"),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const { toast } = useToast();
  const createSupport = useCreateSupportRequest();
  
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: SupportFormValues) => {
    createSupport.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Request submitted",
          description: "We've received your message and will get back to you shortly.",
        });
        form.reset();
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Error submitting request",
          description: "Please try again later.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <PageMeta title="Support & FAQ" />
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">Support & FAQ</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Need help unlocking the vault or using our resources? We're here for you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-serif font-medium mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border">
                <AccordionTrigger className="text-left font-medium">How do I get access to the vault?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Access is granted when you start a new trial via our partner link on the Unlock page. Once you've completed the signup, return to the Unlock page and click "Verify My Access" to instantly unlock the library.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-border">
                <AccordionTrigger className="text-left font-medium">I completed the signup but still don't have access.</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  It can sometimes take up to 24 hours for tracking data to sync between our partner and our system. If it's been more than 24 hours, please submit a support request with the email you used to sign up.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-border">
                <AccordionTrigger className="text-left font-medium">Are the prompts and skills updated?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, we regularly update the library with new tactics, refined prompts for the latest AI models, and fresh cheat sheets. Your unlocked access includes all future updates.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-border">
                <AccordionTrigger className="text-left font-medium">Can I share resources with my team?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Your access is for a single user, but many of our cheat sheets and playbooks include downloadable assets designed to be shared internally with your immediate team.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <div>
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" /> Contact Support
              </CardTitle>
              <CardDescription>
                Send us a message and we'll reply as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Access/Unlock Issue">Access & Unlock Issues</SelectItem>
                            <SelectItem value="Resource Request">Request a New Resource</SelectItem>
                            <SelectItem value="Feedback">Feedback</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details..." 
                            className="min-h-[150px] resize-none bg-white" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full rounded-full shadow-sm"
                    disabled={createSupport.isPending}
                  >
                    {createSupport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Message
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
