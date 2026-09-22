import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCircle, type Circle } from "@/lib/circle-api";
import { ArrowLeft, EyeOff, MoreHorizontal, Pin, Search, Settings2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/velora/app-shell";
import { MessageBubble, MessageComposer } from "@/components/velora/chat";
import {
  ManageCircleModal,
  ScheduleMeetingModal,
} from "@/components/velora/modals";
import { IconButton, PrivacyBadge } from "@/components/velora/primitives";
import { currentUser, messageThread } from "@/lib/mock-data";
import {
  getCircleMeetings,
  type CircleMeeting,
} from "@/lib/circle-meeting-api";
export const Route = createFileRoute("/circles/$circleId")({
  head: () => ({
    meta: [
      { title: "Private Circle — Velora Circle" },
      {
        name: "description",
        content:
          "A private Circle conversation. Member directory hidden, member count hidden, invitations restricted.",
      },
      { property: "og:title", content: "Private Circle — Velora Circle" },
      {
        property: "og:description",
        content: "Private space · Member directory hidden.",
      },
    ],
  }),
  component: CirclePage,
});

function CirclePage() {
  const { circleId } = useParams({ from: "/circles/$circleId" });
  const [circle, setCircle] =
    useState<Circle | null>(null);
  const [meetings, setMeetings] =
    useState<CircleMeeting[]>([]);
  useEffect(() => {
    getCircle(circleId)
      .then(setCircle)
      .catch((error) => {
        console.error(
          "Failed to load Circle:",
          error,
        );
      });
  }, [circleId]);
  useEffect(() => {
    getCircleMeetings(circleId)
      .then(setMeetings)
      .catch((error) => {
        console.error(
          "Failed to load Circle meetings:",
          error,
        );
      });
  }, [circleId]);

  if (!circle) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Loading Circle...
          </p>
        </div>
      </AppShell>
    );
  }
  const isAdmin =
    currentUser.role === "admin" ||
    currentUser.role === "owner";

  return (
    <AppShell
      flush
      rightPanel={
        <div className="space-y-5">
          <div className="surface-panel rounded-2xl p-4">
            <h2 className="text-sm font-semibold">About this Circle</h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {circle.description}
            </p>
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Private space. Messages are visible only to authorized participants.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Circle Meetings
                </h2>

                <p className="text-muted-foreground text-xs">
                  Scheduled meetings for this Circle
                </p>
              </div>
            </div>

            {meetings.length === 0 ? (
              <div className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground text-sm">
                  No meetings scheduled.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="border-border rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {meeting.title}
                        </p>

                        {meeting.description && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {meeting.description}
                          </p>
                        )}

                        <p className="text-muted-foreground mt-2 text-xs">
                          {new Date(
                            meeting.scheduledAt,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <span className="text-xs capitalize">
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="surface-panel rounded-2xl p-4">
            <h2 className="text-sm font-semibold">Permissions</h2>
            <ul className="mt-3 space-y-2">
              {["Member directory hidden", "Member count hidden", "Invitations restricted"].map(
                (p) => (
                  <li key={p} className="text-muted-foreground flex items-center gap-2 text-xs">
                    <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {p}
                  </li>
                ),
              )}
            </ul>
          </div>

          {isAdmin && (
            <ManageCircleModal
              circleId={circleId}
              circleName={circle.name}
              trigger={
                <Button variant="outline" className="w-full">
                  <Settings2 className="h-4 w-4" /> Manage Circle
                </Button>
              }
            />
          )}
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-border bg-background/70 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/circles" aria-label="Back to Circles">
              <IconButton icon={ArrowLeft} label="Back to Circles" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">{circle.name}</h1>
              <p className="text-muted-foreground truncate text-[11px]">
                Private space · Member directory hidden
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PrivacyBadge label="Private Circle" tone="accent" className="hidden sm:inline-flex" />
            <IconButton icon={Search} label="Search in Circle" />
            <ScheduleMeetingModal
              circleId={circleId}
              trigger={
                <IconButton
                  icon={Video}
                  label="Start Circle meeting"
                />
              }
            />
            <IconButton icon={MoreHorizontal} label="More options" />
          </div>
        </header>

        <div className="scrollbar-slim min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="border-border bg-surface-2/50 flex items-start gap-2.5 rounded-xl border px-3.5 py-3">
            <Pin className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p className="text-muted-foreground min-w-0 text-xs">
              <span className="text-foreground font-medium">Pinned · </span>
              Release checklist for Nova v2 — review before tonight's session.
            </p>
          </div>

          <div className="flex justify-center">
            <PrivacyBadge label="Member visibility restricted" tone="muted" icon={EyeOff} />
          </div>

          {messageThread.map((m) => (
            <MessageBubble
              key={m.id}
              message={{
                id: m.id,
                author: m.author,
                body: m.body ?? "",
                time: m.time,
                initials: m.initials,
                self: m.self ?? false,

                ...(m.kind
                  ? {
                    kind:
                      m.kind === "image"
                        ? "file"
                        : m.kind,
                  }
                  : {}),

                ...(m.file
                  ? {
                    file: {
                      ...m.file,
                      url: "",
                    },
                  }
                  : {}),

                ...(m.replyTo
                  ? {
                    replyTo: m.replyTo,
                  }
                  : {}),

                ...(m.reactions
                  ? {
                    reactions: m.reactions,
                  }
                  : {}),
              }}
            />
          ))}
        </div>

        <div className="pb-16 lg:pb-0">
          <MessageComposer
            placeholder={`Message ${circle.name}…`}
            conversationId={circleId}
            onMessageSent={() => { }}
          />
        </div>
      </div>
    </AppShell>
  );
}


