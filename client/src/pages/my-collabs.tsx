import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Inbox, Send, Check, X, ArrowRight, Users } from "lucide-react";
import type { CollabRequestWithMeta } from "@shared/schema";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-900",
  declined: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function MyCollabsPage() {
  const requestsQ = useQuery<{ sent: CollabRequestWithMeta[]; received: CollabRequestWithMeta[] }>({
    queryKey: ["/api/collabs/my/requests"],
  });

  const received = requestsQ.data?.received || [];
  const sent = requestsQ.data?.sent || [];
  const pendingCount = received.filter((r) => r.status === "pending").length;

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My collab inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track collab requests you've received and sent.
          </p>
        </div>
        <Link href="/collabs">
          <Button variant="outline" className="gap-2" data-testid="link-back-to-feed">
            <Users className="w-4 h-4" /> Browse collabs
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="mb-5">
          <TabsTrigger value="received" data-testid="tab-received" className="gap-2">
            <Inbox className="w-4 h-4" /> Received
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-semibold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent" className="gap-2">
            <Send className="w-4 h-4" /> Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {requestsQ.isLoading ? (
            <SkeletonList />
          ) : received.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-6 h-6 text-primary" />}
              title="No collab requests yet"
              body="When other creators send you a collab request, it'll show up here. Post a listing to get the ball rolling."
              cta={<Link href="/collabs/new"><Button className="bg-primary hover:bg-primary/90">Post a listing</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {received.map((r) => <RequestCard key={r.id} req={r} kind="received" />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {requestsQ.isLoading ? (
            <SkeletonList />
          ) : sent.length === 0 ? (
            <EmptyState
              icon={<Send className="w-6 h-6 text-primary" />}
              title="You haven't sent any requests"
              body="Browse the collab feed and reach out to creators whose listings match your vibe."
              cta={<Link href="/collabs"><Button className="bg-primary hover:bg-primary/90 gap-2">Browse collabs <ArrowRight className="w-4 h-4" /></Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {sent.map((r) => <RequestCard key={r.id} req={r} kind="sent" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestCard({ req, kind }: { req: CollabRequestWithMeta; kind: "sent" | "received" }) {
  const { toast } = useToast();
  const counterparty = kind === "received" ? req.fromName : req.toName;

  const respond = useMutation({
    mutationFn: async (status: "accepted" | "declined") =>
      apiRequest("PATCH", `/api/collab-requests/${req.id}`, { status }),
    onSuccess: (_d, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collabs/my/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collabs/my/pending-count"] });
      toast({ title: status === "accepted" ? "Request accepted" : "Request declined" });
    },
    onError: (err: any) => toast({ title: "Couldn't update", description: err.message, variant: "destructive" }),
  });

  return (
    <Card className="p-5" data-testid={`card-request-${req.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base truncate" data-testid={`text-listing-${req.id}`}>{req.listingTitle}</h3>
            <Badge className={`${STATUS_STYLES[req.status] || ""} border text-xs px-2 py-0.5`} data-testid={`badge-status-${req.id}`}>
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {kind === "received" ? "From" : "To"}{" "}
            <span className="font-medium text-foreground">{counterparty}</span>
            <span> · {timeAgo(req.createdAt)}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/80 mt-3 whitespace-pre-wrap leading-relaxed">{req.message}</p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-card-border">
        <Link href={`/collabs`} className="text-xs text-primary hover:underline" data-testid={`link-view-listing-${req.id}`}>
          View listing →
        </Link>
        {kind === "received" && req.status === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => respond.mutate("declined")}
              disabled={respond.isPending}
              data-testid={`button-decline-${req.id}`}
            >
              <X className="w-3.5 h-3.5" /> Decline
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-1"
              onClick={() => respond.mutate("accepted")}
              disabled={respond.isPending}
              data-testid={`button-accept-${req.id}`}
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, body, cta }: { icon: React.ReactNode; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">{body}</p>
      {cta}
    </Card>
  );
}
