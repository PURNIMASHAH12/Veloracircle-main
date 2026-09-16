import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/velora/app-shell";
import {
  MessageBubble,
  MessageComposer,
} from "@/components/velora/chat";
import {
  IconButton,
  PrivacyBadge,
} from "@/components/velora/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Velora Circle" },
      {
        name: "description",
        content:
          "Private one-to-one and Circle conversations with hidden participant information and encrypted delivery.",
      },
      {
        property: "og:title",
        content: "Messages — Velora Circle",
      },
      {
        property: "og:description",
        content: "Private conversations without unnecessary visibility.",
      },
    ],
  }),
  component: MessagesPage,
});

type BackendMessage = {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  text: string;
  createdAt: string;
};

type BackendConversation = {
  id: string;
  type: "direct";
  otherUser: {
    id: string;
    name: string;
    email: string;
  } | null;

  latestMessage: {
    text: string;
    createdAt: string;
    sender: string;
  } | null;
};

type SearchUser = {
  _id: string;
  name: string;
  email: string;
};

function MessagesPage() {
  const [backendConversations, setBackendConversations] = useState<
    BackendConversation[]
  >([]);

  const [backendMessages, setBackendMessages] = useState<BackendMessage[]>(
    [],
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  // --------------------------------------------------
  // Load conversations
  // --------------------------------------------------

  useEffect(() => {
    const loadConversations = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          "http://localhost:5000/api/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load conversations");
        }

        const data = await response.json();

        setBackendConversations(data.conversations);

        if (data.conversations.length > 0) {
          setActiveId(data.conversations[0].id);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    loadConversations();
  }, []);

  // --------------------------------------------------
  // Load messages for active conversation
  // --------------------------------------------------

  useEffect(() => {
    console.log("ACTIVE CONVERSATION ID:", activeId);

    if (!activeId) {
      setBackendMessages([]);
      return;
    }

    console.log("LOADING MESSAGES FOR:", activeId);

    const loadMessages = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/messages/${activeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();

        console.log("MESSAGES API RESPONSE:", data);

        setBackendMessages(data.data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [activeId]);

  // --------------------------------------------------
  // Search users
  // --------------------------------------------------

  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearch.trim()) {
        setSearchResults([]);
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(
            userSearch,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();

        setSearchResults(data.users);
      } catch (error) {
        console.error("Failed to search users:", error);
        setSearchResults([]);
      }
    };

    searchUsers();
  }, [userSearch]);

  // --------------------------------------------------
  // Active conversation
  // --------------------------------------------------

  const activeConversation = backendConversations.find(
    (conversation) => conversation.id === activeId,
  );

  const activeName =
    activeConversation?.otherUser?.name || "Select a conversation";

  const activeInitials =
    activeConversation?.otherUser?.name?.slice(0, 2).toUpperCase() || "VC";

  // --------------------------------------------------
  // Conversation list filtering
  // --------------------------------------------------

  const list = backendConversations.filter((conversation) => {
    const name = conversation.otherUser?.name || "";

    return name.toLowerCase().includes(query.toLowerCase());
  });

  // --------------------------------------------------
  // Start new conversation
  // --------------------------------------------------

  const startConversation = async (user: SearchUser) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user._id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create conversation",
        );
      }

      const newConversationId = data.conversation.id;

      // Reload conversations
      const conversationResponse = await fetch(
        "http://localhost:5000/api/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!conversationResponse.ok) {
        throw new Error("Failed to reload conversations");
      }

      const conversationData = await conversationResponse.json();

      setBackendConversations(conversationData.conversations);

      // Select new/existing conversation
      setActiveId(newConversationId);

      // Close popup
      setShowNewConversation(false);
      setUserSearch("");
      setSearchResults([]);

      // Open conversation on mobile
      setMobileOpen(true);
    } catch (error) {
      console.error("Failed to start conversation:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start conversation",
      );
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <AppShell flush>
      <div className="flex h-full min-h-0">
        {/* ==========================================
            CONVERSATION LIST
        ========================================== */}

        <div
          className={cn(
            "border-border flex min-h-0 w-full flex-col border-r md:w-[320px] md:shrink-0",
            mobileOpen && "hidden md:flex",
          )}
        >
          <div className="space-y-3 p-3">
            {/* Search + New Conversation */}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  aria-hidden
                />

                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  className="pl-9"
                />
              </div>

              <button
                type="button"
                aria-label="New conversation"
                onClick={() => {
                  setShowNewConversation(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>

                <TabsTrigger value="unread" className="flex-1">
                  Unread
                </TabsTrigger>

                <TabsTrigger value="pinned" className="flex-1">
                  Pinned
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversation items */}

          <div className="scrollbar-slim min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-24 lg:pb-3">
            {list.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                No conversations
              </p>
            ) : (
              list.map((conversation) => {
                const name =
                  conversation.otherUser?.name || "Unknown user";

                const initials = name.slice(0, 2).toUpperCase();

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setActiveId(conversation.id);
                      setMobileOpen(true);
                    }}
                    className={cn(
                      "hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                      conversation.id === activeId && "bg-muted",
                    )}
                  >
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {name}
                      </p>

                      <p className="text-muted-foreground truncate text-xs">
                        {conversation.latestMessage?.text || "Private conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ==========================================
            CONVERSATION WINDOW
        ========================================== */}

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            !mobileOpen && "hidden md:flex",
          )}
        >
          {/* Header */}

          <header className="border-border bg-background/70 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                label="Back to conversations"
                className="md:hidden"
                onClick={() => setMobileOpen(false)}
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {activeName}
                </p>

                <p className="text-muted-foreground truncate text-[11px]">
                  Private conversation
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={Search}
                label="Search in conversation"
                className="hidden sm:inline-flex"
              />

              <IconButton
                icon={Phone}
                label="Start audio call"
              />

              <IconButton
                icon={Video}
                label="Start video call"
              />

              <IconButton
                icon={MoreHorizontal}
                label="More options"
              />
            </div>
          </header>

          {/* Messages */}

          <div className="scrollbar-slim min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-6">
            <div className="flex justify-center">
              <PrivacyBadge
                label="Messages are visible only to authorized participants"
                tone="muted"
              />
            </div>

            {backendMessages.map((message) => {
              const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}",
              );

              const currentUserId =
                currentUser.id || currentUser._id;

              const isSelf = message.sender._id === currentUserId;

              return (
                <MessageBubble
                  key={message._id}
                  message={{
                    id: message._id,
                    author: isSelf ? "You" : activeName,
                    body: message.text,
                    time: new Date(
                      message.createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    initials: isSelf
                      ? currentUser.name
                        ?.slice(0, 2)
                        .toUpperCase() || "ME"
                      : activeInitials,
                    self: isSelf,
                  }}
                />
              );
            })}
          </div>

          {/* Composer */}

          <div className="pb-16 lg:pb-0">
            <MessageComposer
              placeholder={`Message ${activeName}…`}
              conversationId={activeId || ""}
              onMessageSent={(message) => {
                setBackendMessages((previous) => [
                  ...previous,
                  message,
                ]);
                setBackendConversations((previous) =>
                  previous
                    .map((conversation) =>
                      conversation.id === activeId
                        ? {
                          ...conversation,
                          latestMessage: {
                            text: message.text,
                            createdAt: message.createdAt,
                            sender: message.sender._id,
                          },
                        }
                        : conversation,
                    )
                    .sort(
                      (a, b) =>
                        new Date(
                          b.latestMessage?.createdAt || 0,
                        ).getTime() -
                        new Date(
                          a.latestMessage?.createdAt || 0,
                        ).getTime(),
                    ),
                );
              }}
            />
          </div>
        </section>

        {/* ==========================================
            NEW CONVERSATION POPUP
        ========================================== */}

        {showNewConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-background border-border w-full max-w-md rounded-2xl border p-5 shadow-xl">
              {/* Popup header */}

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    New conversation
                  </h2>

                  <p className="text-muted-foreground mt-1 text-xs">
                    Search for a user to start a conversation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewConversation(false);
                    setUserSearch("");
                    setSearchResults([]);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* User search */}

              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                autoFocus
              />

              {/* Search results */}

              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => startConversation(user)}
                    className="hover:bg-muted flex w-full items-center gap-3 rounded-xl p-3 text-left"
                  >
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>

                      <p className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}

                {userSearch && searchResults.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No users found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}