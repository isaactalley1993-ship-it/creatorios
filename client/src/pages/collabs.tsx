import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Lock, Users, Send, Inbox, Sparkles } from "lucide-react";
import type { CollabListingWithAuthor } from "@shared/schema";

const PLATFORMS = ["youtube", "tiktok", "instagram", "twitch", "podcast", "onlyfans", "other"];
const NICHES = ["fitness", "cooking", "gaming", "finance", "fashion", "beauty", "tech", "travel", "lifestyle", "other"];
const AUDIENCES = ["1K-10K", "10K-50K", "50K-100K", "100K-500K", "500K+"];
const COLLAB_TYPES = ["video", "podcast", "shoutout", "campaign", "sponsorship"];

const PLATFORM_STYLES: Record<string, { bg: string; label: string }> = {
  youtube: { bg: "bg-red-500 text-white", label: "YouTube" },
  tiktok: { bg: "bg-gray-900 text-white", label: "TikTok" },
  instagram: { bg: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", label: "Instagram" },
  twitch: { bg: "bg-purple-600 text-white", label: "Twitch" },
  podcast: { bg: "bg-orange-500 text-white", label: "Podcast" },
  onlyfans: { bg: "bg-cyan-500 text-white", label: "OnlyFans" },
  other: { bg: "bg-slate-500 text-white", label: "Other" },
};

const NICHE_LABELS: Record<string, string> = {
  fitness: "Fitness", cooking: "Cooking", gaming: "Gaming", finance: "Finance",
  fashion: "Fashion", beauty: "Beauty", tech: "Tech", travel: "Travel",
  lifestyle: "Lifestyle", other: "Other",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default function CollabsPage() {
  const { user } = useAuth();
  const isPro = user?.tier === "pro" || user?.tier === "business";
  const [filters, setFilters] = useState({ platform: "all", niche: "all", audienceSize: "all", collabType: "all" });
  const [requestTarget, setRequestTarget] = useState<CollabListingWithAuthor | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.platform !== "all") p.set("platform", filters.platform);
    if (filters.niche !== "all") p.set("niche", filters.niche);
    if (filters.audienceSize !== "all") p.set("audienceSize", filters.audienceSize);
    if (filters.collabType !== "all") p.set("collabType", filters.collabType);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [filters]);

  const listingsQ = useQuery<CollabListingWithAuthor[]>({
    queryKey: ["/api/collabs", qs],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/collabs${qs}`);
      return res.json();
    },
  });

  const listings = listingsQ.data || [];

  function handleSendRequest(listing: CollabListingWithAuthor) {
    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }
    if (user && listing.userId === user.id) return;
    setRequestTarget(listing);
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            Find Your Next Collab Partner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse open listings from creators looking for collab partners across platforms and niches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/my-collabs">
            <Button variant="outline" className="gap-2" data-testid="link-my-collabs">
              <Inbox className="w-4 h-4" /> My inbox
            </Button>
          </Link>
          {isPro ? (
            <Link href="/collabs/new">
              <Button className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-post-collab">
                <Plus className="w-4 h-4" /> Post a collab
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="gap-2 border-dashed"
              onClick={() => setUpgradeOpen(true)}
              data-testid="button-post-collab-locked"
            >
              <Lock className="w-4 h-4" /> Post a collab
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <FilterSelect
            value={filters.platform}
            onChange={(v) => setFilters((f) => ({ ...f, platform: v }))}
            placeholder="All platforms"
            options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_STYLES[p]?.label || capitalize(p) }))}
            testId="filter-platform"
          />
          <FilterSelect
            value={filters.niche}
            onChange={(v) => setFilters((f) => ({ ...f, niche: v }))}
            placeholder="All niches"
            options={NICHES.map((n) => ({ value: n, label: NICHE_LABELS[n] || capitalize(n) }))}
            testId="filter-niche"
          />
          <FilterSelect
            value={filters.audienceSize}
            onChange={(v) => setFilters((f) => ({ ...f, audienceSize: v }))}
            placeholder="All audiences"
            options={AUDIENCES.map((a) => ({ value: a, label: a }))}
            testId="filter-audience"
          />
          <FilterSelect
            value={filters.collabType}
            onChange={(v) => setFilters((f) => ({ ...f, collabType: v }))}
            placeholder="All types"
            options={COLLAB_TYPES.map((c) => ({ value: c, label: capitalize(c) }))}
            testId="filter-type"
          />
        </div>
      </Card>

      {/* Grid */}
      {listingsQ.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState onClearFilters={() => setFilters({ platform: "all", niche: "all", audienceSize: "all", collabType: "all" })} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <CreatorCard
              key={l.id}
              listing={l}
              isOwn={user?.id === l.userId}
              onRequest={() => handleSendRequest(l)}
            />
          ))}
        </div>
      )}

      {requestTarget && (
        <RequestDialog
          listing={requestTarget}
          onClose={() => setRequestTarget(null)}
        />
      )}
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, options, testId }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  testId: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background" data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreatorCard({ listing, isOwn, onRequest }: {
  listing: CollabListingWithAuthor;
  isOwn: boolean;
  onRequest: () => void;
}) {
  const platform = PLATFORM_STYLES[listing.platform] || PLATFORM_STYLES.other;

  return (
    <Card
      className="p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-card border-card-border"
      data-testid={`card-collab-${listing.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge className={`${platform.bg} border-0 px-2.5 py-0.5 text-xs font-semibold`}>
          {platform.label}
        </Badge>
        <span className="text-xs text-muted-foreground" data-testid={`text-time-${listing.id}`}>
          {timeAgo(listing.createdAt)}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-base leading-snug line-clamp-2" data-testid={`text-title-${listing.id}`}>
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span data-testid={`text-author-${listing.id}`} className="font-medium text-foreground">{listing.authorName}</span>
          <span>·</span>
          <span>{NICHE_LABELS[listing.niche] || capitalize(listing.niche)}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">{listing.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        <Badge variant="outline" className="text-xs bg-accent/40 border-accent-foreground/10">
          {listing.audienceSize}
        </Badge>
        <Badge variant="outline" className="text-xs bg-secondary/40 border-secondary-foreground/10 text-secondary-foreground">
          {capitalize(listing.collabType)}
        </Badge>
      </div>

      <Button
        onClick={onRequest}
        disabled={isOwn}
        className="bg-primary hover:bg-primary/90 gap-2 mt-1"
        data-testid={`button-request-${listing.id}`}
      >
        <Send className="w-3.5 h-3.5" />
        {isOwn ? "Your listing" : "Send Request"}
      </Button>
    </Card>
  );
}

function RequestDialog({ listing, onClose }: { listing: CollabListingWithAuthor; onClose: () => void }) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const m = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/collabs/${listing.id}/request`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collabs/my/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collabs/my/pending-count"] });
      toast({ title: "Request sent", description: `${listing.authorName} will see this in their inbox.` });
      onClose();
    },
    onError: (err: any) => toast({ title: "Couldn't send", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send collab request</DialogTitle>
          <DialogDescription>
            Reaching out to <span className="font-medium text-foreground">{listing.authorName}</span> about
            <span className="font-medium text-foreground"> "{listing.title}"</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (message.trim()) m.mutate(); }} className="space-y-4">
          <Textarea
            rows={6}
            placeholder="Hey! I think we'd be a great fit because…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            data-testid="input-collab-message"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={m.isPending || !message.trim()} data-testid="button-send-request">
              {m.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coral" /> Upgrade to unlock the Collab Network
          </DialogTitle>
          <DialogDescription>
            Posting listings and sending requests is part of CreatorOS Pro. Upgrade to message other creators directly and start building partnerships.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm space-y-2 my-2">
          <li className="flex gap-2"><Users className="w-4 h-4 text-primary mt-0.5" /> Post unlimited collab listings</li>
          <li className="flex gap-2"><Send className="w-4 h-4 text-primary mt-0.5" /> Send and receive collab requests</li>
          <li className="flex gap-2"><Sparkles className="w-4 h-4 text-primary mt-0.5" /> Unlock unlimited income, deals, and tax tools</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Maybe later</Button>
          <Link href="/pricing">
            <Button className="bg-primary hover:bg-primary/90" onClick={onClose} data-testid="button-upgrade-collab">See plans</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg">No collab listings match those filters</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
        Try widening your filters, or be the first to post a listing for the niche you're in.
      </p>
      <Button variant="outline" onClick={onClearFilters} data-testid="button-clear-filters">Clear filters</Button>
    </Card>
  );
}
