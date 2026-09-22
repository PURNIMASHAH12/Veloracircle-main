import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark,
  ExternalLink,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AppShell } from "@/components/velora/app-shell";
import { FileRow } from "@/components/velora/cards";
import { EmptyState } from "@/components/velora/primitives";
import type { FileItem } from "@/lib/mock-data";
import {
  savedLinks,
  savedMessages,
} from "@/lib/mock-data";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — Velora Circle" },
      {
        name: "description",
        content:
          "Saved messages, files and links from your private Velora conversations.",
      },
      {
        property: "og:title",
        content: "Saved — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Everything you kept, privately.",
      },
    ],
  }),
  component: SavedPage,
});

/* =====================================================
   TYPES
===================================================== */

type SavedFile = {
  id: string;

  message?: {
    _id: string;
  };

  file?: {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  };

  createdAt: string;
};

/* =====================================================
   FILE TYPE
===================================================== */

const getFileType = (
  mimeType: string,
  fileName: string,
): FileItem["type"] => {
  const extension = fileName
    .split(".")
    .pop()
    ?.toLowerCase();

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (
    mimeType === "application/pdf" ||
    extension === "pdf"
  ) {
    return "pdf";
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(
      extension || "",
    )
  ) {
    return "sheet";
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    ["zip", "rar", "7z"].includes(
      extension || "",
    )
  ) {
    return "zip";
  }

  return "doc";
};

/* =====================================================
   PAGE
===================================================== */

function SavedPage() {
  const [savedFiles, setSavedFiles] =
    useState<SavedFile[]>([]);

  const [loadingFiles, setLoadingFiles] =
    useState(true);

  /* =====================================================
     LOAD SAVED FILES
  ===================================================== */

  useEffect(() => {
    const loadSavedFiles = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoadingFiles(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/messages/saved",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load saved files",
          );
        }

        const filesOnly =
          Array.isArray(data.savedItems)
            ? data.savedItems.filter(
                (item: SavedFile) =>
                  Boolean(item.file),
              )
            : [];

        setSavedFiles(filesOnly);
      } catch (error) {
        console.error(
          "Failed to load saved files:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load saved files",
        );
      } finally {
        setLoadingFiles(false);
      }
    };

    void loadSavedFiles();
  }, []);

  /* =====================================================
     FORMAT SAVED FILES
  ===================================================== */

  const displayFiles: FileItem[] =
    savedFiles
      .filter(
        (saved) => Boolean(saved.file),
      )
      .map((saved) => {
        const file =
          saved.file!;

        return {
          id:
            saved.message?._id ||
            saved.id,

          name: file.name,

          size:
            (file.size || 0) >=
            1024 * 1024
              ? `${(
                  (file.size || 0) /
                  (1024 * 1024)
                ).toFixed(1)} MB`
              : `${(
                  (file.size || 0) /
                  1024
                ).toFixed(1)} KB`,

          type: getFileType(
            file.mimeType ||
              "application/octet-stream",
            file.name,
          ),

          date: new Date(
            saved.createdAt,
          ).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          }),

          owner: "Saved by you",

          group: "mine",
        };
      });

  /* =====================================================
     REMOVE SAVED FILE
  ===================================================== */

  const handleRemoveSavedFile =
    async (savedItemId: string) => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        toast.error(
          "Authentication required",
        );
        return;
      }

      try {
        const response =
          await fetch(
            `/api/messages/saved/${savedItemId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove saved file",
          );
        }

        setSavedFiles(
          (currentFiles) =>
            currentFiles.filter(
              (item) =>
                item.id !==
                savedItemId,
            ),
        );

        toast.success(
          "Removed from Saved",
        );
      } catch (error) {
        console.error(
          "Remove saved file error:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove saved file",
        );
      }
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Saved
          </h1>

          <p className="text-muted-foreground mt-1.5 text-sm">
            Private to you — nothing here
            is shared back to a Circle.
          </p>
        </header>

        <Tabs defaultValue="messages">
          <TabsList>
            <TabsTrigger value="messages">
              Messages
            </TabsTrigger>

            <TabsTrigger value="files">
              Files
            </TabsTrigger>

            <TabsTrigger value="links">
              Links
            </TabsTrigger>
          </TabsList>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <TabsContent
            value="messages"
            className="mt-5 space-y-3"
          >
            {savedMessages.map((s) => (
              <article
                key={s.id}
                className="surface-panel rounded-2xl p-4"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-xl">
                    <MessageSquare
                      className="h-4 w-4"
                      aria-hidden
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {s.from}
                    </p>

                    <p className="text-muted-foreground truncate text-[11px]">
                      {s.circle}
                    </p>
                  </div>

                  <span className="text-muted-foreground text-[11px]">
                    {s.time}
                  </span>
                </div>

                <p className="text-foreground/85 mt-3 text-[13px] leading-relaxed">
                  {s.body}
                </p>
              </article>
            ))}
          </TabsContent>

          {/* =================================================
              FILES
          ================================================= */}

          <TabsContent
            value="files"
            className="mt-5"
          >
            {loadingFiles ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                Loading saved files...
              </div>
            ) : displayFiles.length ? (
              <div className="surface-panel overflow-hidden rounded-2xl">
                {displayFiles.map(
                  (file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={Bookmark}
                title="No saved files"
                description="Files you save from conversations will appear here."
              />
            )}
          </TabsContent>

          {/* =================================================
              LINKS
          ================================================= */}

          <TabsContent
            value="links"
            className="mt-5 space-y-3"
          >
            {savedLinks.length ? (
              savedLinks.map((l) => (
                <div
                  key={l.id}
                  className="surface-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"
                >
                  <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-xl">
                    <ExternalLink
                      className="h-4 w-4"
                      aria-hidden
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {l.title}
                    </p>

                    <p className="text-muted-foreground truncate text-[11px]">
                      {l.url}
                    </p>
                  </div>

                  <span className="text-muted-foreground text-[11px]">
                    {l.time}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Bookmark}
                title="No saved items"
                description="Save important messages, files, and links here."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* ARCHIVE */}

        <div className="mt-10">
          <EmptyState
            icon={FileText}
            title="Archive is empty"
            description="Older saved items you archive will appear in this section."
          />
        </div>
      </div>
    </AppShell>
  );
}