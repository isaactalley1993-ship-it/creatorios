import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";

const PLATFORMS = [
  { v: "youtube", l: "YouTube" }, { v: "tiktok", l: "TikTok" }, { v: "instagram", l: "Instagram" }, { v: "onlyfans", l: "OnlyFans" },
  { v: "twitch", l: "Twitch" }, { v: "podcast", l: "Podcast" }, { v: "other", l: "Other" },
];
const NICHES = [
  { v: "fitness", l: "Fitness" }, { v: "cooking", l: "Cooking" }, { v: "gaming", l: "Gaming" },
  { v: "finance", l: "Finance" }, { v: "fashion", l: "Fashion" }, { v: "beauty", l: "Beauty" },
  { v: "tech", l: "Tech" }, { v: "travel", l: "Travel" }, { v: "lifestyle", l: "Lifestyle" }, { v: "other", l: "Other" },
];
const AUDIENCES = ["1K-10K", "10K-50K", "50K-100K", "100K-500K", "500K+"];
const TYPES = [
  { v: "video", l: "Video collab" }, { v: "podcast", l: "Podcast" },
  { v: "shoutout", l: "Shoutout" }, { v: "campaign", l: "Campaign" }, { v: "sponsorship", l: "Sponsorship" },
];

export default function CollabsNewPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isPro = user?.tier === "pro" || user?.tier === "business";

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [niche, setNiche] = useState("tech");
  const [audienceSize, setAudienceSize] = useState("10K-50K");
  const [collabType, setCollabType] = useState("video");
  const [description, setDescription] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  const m = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/collabs", {
      title, platform, niche, audienceSize, collabType, description, lookingFor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collabs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collabs/my/listings"] });
      toast({ title: "Listing posted", description: "Other creators can now discover and reach out." });
      setLocation("/collabs");
    },
    onError: (err: any) => toast({ title: "Couldn't post", description: err.message, variant: "destructive" }),
  });

  if (!isPro) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-2xl mx-auto">
        <Card className="p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-coral" />
          </div>
          <h2 className="text-xl font-bold">Posting collabs is a Pro feature</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Upgrade to CreatorOS Pro to post collab listings and start building partnerships with other creators.
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <Link href="/collabs"><Button variant="outline">Back to feed</Button></Link>
            <Link href="/pricing"><Button className="bg-primary hover:bg-primary/90 gap-2"><Sparkles className="w-4 h-4" /> See plans</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-2xl mx-auto">
      <Link href="/collabs">
        <Button variant="ghost" size="sm" className="gap-1 mb-3 -ml-2" data-testid="link-back-to-collabs">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Button>
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Post a collab listing</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Describe what you're working on and what kind of partner you're looking for.
      </p>

      <Card className="p-5 sm:p-7">
        <form
          onSubmit={(e) => { e.preventDefault(); if (title && description && lookingFor) m.mutate(); }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="title">Listing title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. YouTube cooking creator seeks fitness collab"
              className="mt-1.5"
              data-testid="input-listing-title"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Your platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1.5" data-testid="select-platform"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Your niche</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="mt-1.5" data-testid="select-niche"><SelectValue /></SelectTrigger>
                <SelectContent>{NICHES.map((n) => <SelectItem key={n.v} value={n.v}>{n.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Audience size</Label>
              <Select value={audienceSize} onValueChange={setAudienceSize}>
                <SelectTrigger className="mt-1.5" data-testid="select-audience"><SelectValue /></SelectTrigger>
                <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collab type</Label>
              <Select value={collabType} onValueChange={setCollabType}>
                <SelectTrigger className="mt-1.5" data-testid="select-type"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="What's the project? What's the format, timeline, and what's in it for both sides?"
              className="mt-1.5"
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="lookingFor">Looking for</Label>
            <Input
              id="lookingFor"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              required
              placeholder="e.g. Fitness creator with 50K+ on Instagram"
              className="mt-1.5"
              data-testid="input-looking-for"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Link href="/collabs"><Button type="button" variant="outline">Cancel</Button></Link>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={m.isPending}
              data-testid="button-publish-listing"
            >
              {m.isPending ? "Publishing…" : "Publish listing"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
