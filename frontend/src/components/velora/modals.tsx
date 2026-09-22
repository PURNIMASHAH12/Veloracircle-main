import {
  CheckCircle2,
  Lock,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { CircleMemberManager } from "@/components/velora/CircleMemberManager";
import { Button } from "@/components/ui/button";
import { createCircleMeeting } from "@/lib/circle-meeting-api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  createCircle,
  deleteCircle,
  editCircle,
  getMyCircles,
  type Circle,
} from "@/lib/circle-api";
import { leaveCircle } from "@/lib/circle-member-api";

export function PrivacyToggle({
  label,
  description,
  defaultChecked = true,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="border-border bg-surface-2/40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-4 py-3">
      <div className="min-w-0">
        <Label
          htmlFor={id}
          className="text-[13px] font-medium"
        >
          {label}
        </Label>

        {description && (
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <Switch
        id={id}
        defaultChecked={defaultChecked}
      />
    </div>
  );
}

export function CreateCircleModal({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] =
    useState(false);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);
  const [availableCircles, setAvailableCircles] =
    useState<Circle[]>([]);

  const [selectedCircleId, setSelectedCircleId] =
    useState(circleId);

  const [loadingCircles, setLoadingCircles] =
    useState(false);

  async function handleCreateCircle() {
    if (!name.trim()) {
      toast.error("Circle name is required");
      return;
    }

    try {
      setSaving(true);

      await createCircle({
        name: name.trim(),
        description:
          description.trim(),
      });

      toast.success(
        "Circle created successfully",
        {
          description:
            "Your private Circle has been created.",
        },
      );

      setName("");
      setDescription("");
      setOpen(false);
    } catch (error) {
      console.error(
        "Create Circle error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Circle",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock
              className="text-primary h-4 w-4"
              aria-hidden
            />
            Create a Private Circle
          </DialogTitle>

          <DialogDescription>
            Circles are private by default. Visibility settings can be tightened at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="circle-name">
              Circle name
            </Label>

            <Input
              id="circle-name"
              placeholder="e.g. Project Nova"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="circle-description">
              Description
            </Label>

            <Textarea
              id="circle-description"
              rows={3}
              placeholder="What is this Circle for?"
              className="resize-none"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="circle-privacy">
              Privacy level
            </Label>

            <Select defaultValue="private">
              <SelectTrigger
                id="circle-privacy"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="private">
                  Private
                </SelectItem>

                <SelectItem value="restricted">
                  Restricted
                </SelectItem>

                <SelectItem value="invite">
                  Invite only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              Visibility controls
            </p>

            <PrivacyToggle
              label="Hide member count"
            />

            <PrivacyToggle
              label="Hide member directory"
            />

            <PrivacyToggle
              label="Hide online status"
            />

            <PrivacyToggle
              label="Disable join and leave notifications"
            />

            <PrivacyToggle
              label="Restrict invitations"
              defaultChecked={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() =>
              setOpen(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateCircle}
            disabled={
              saving ||
              !name.trim()
            }
          >
            {saving
              ? "Creating..."
              : "Create Circle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleMeetingModal({
  trigger,
  circleId,
}: {
  trigger: ReactNode;
  circleId: string;
}) {
  const [open, setOpen] =
    useState(false);

  const [done, setDone] =
    useState(false);
  const [title, setTitle] =
    useState("");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={async (v) => {
        setOpen(v);

        if (v) {
          try {
            setLoadingCircles(true);

            const result =
              await getMyCircles();

            setAvailableCircles(result);

            const currentCircleExists =
              result.some(
                (circle) =>
                  circle._id === circleId,
              );

            if (currentCircleExists) {
              setSelectedCircleId(circleId);
            } else if (result.length > 0) {
              setSelectedCircleId(
                result[0]._id,
              );
            }
          } catch (error) {
            console.error(
              "Load Circles error:",
              error,
            );

            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to load Circles",
            );
          } finally {
            setLoadingCircles(false);
          }
        }

        if (!v) {
          setTimeout(
            () => setDone(false),
            200,
          );
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[540px]">
        {done ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="bg-success/15 text-success grid h-14 w-14 place-items-center rounded-2xl">
              <CheckCircle2
                className="h-7 w-7"
                aria-hidden
              />
            </span>

            <DialogTitle className="mt-5 text-base">
              Meeting scheduled
            </DialogTitle>

            <DialogDescription className="mt-1.5 max-w-xs text-xs">
              Invitations were sent privately. Participants are not disclosed to attendees.
            </DialogDescription>

            <Button
              className="mt-6"
              onClick={() =>
                setOpen(false)
              }
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck
                  className="text-primary h-4 w-4"
                  aria-hidden
                />
                Schedule a meeting
              </DialogTitle>

              <DialogDescription>
                Meetings inherit the privacy posture of the selected Circle.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">
                  Meeting title
                </Label>

                <Input
                  id="meeting-title"
                  placeholder="Product Strategy"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-date">
                    Date
                  </Label>

                  <Input
                    id="meeting-date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-time">
                    Time
                  </Label>

                  <Input
                    id="meeting-time"
                    type="time"
                    value={time}
                    onChange={(event) =>
                      setTime(event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">
                    Duration
                  </Label>

                  <Select defaultValue="45">
                    <SelectTrigger
                      id="meeting-duration"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="15">
                        15 min
                      </SelectItem>

                      <SelectItem value="30">
                        30 min
                      </SelectItem>

                      <SelectItem value="45">
                        45 min
                      </SelectItem>

                      <SelectItem value="60">
                        1 hour
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-circle">
                  Circle / participants
                </Label>

                <Select
                  value={selectedCircleId}
                  onValueChange={setSelectedCircleId}
                  disabled={
                    loadingCircles ||
                    availableCircles.length === 0
                  }
                >
                  <SelectTrigger
                    id="meeting-circle"
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={
                        loadingCircles
                          ? "Loading Circles..."
                          : "Select a Circle"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableCircles.map((circle) => (
                      <SelectItem
                        key={circle._id}
                        value={circle._id}
                      >
                        {circle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div className="space-y-2">
                <Label htmlFor="meeting-description">
                  Description
                </Label>

                <Textarea
                  id="meeting-description"
                  rows={3}
                  className="resize-none"
                  placeholder="Agenda and context"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
                  Privacy
                </p>

                <PrivacyToggle
                  label="Private meeting"
                  description="Participant list is hidden from attendees."
                />

                <PrivacyToggle
                  label="Invite only"
                  description="Link joining is disabled."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() =>
                  setOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                disabled={saving}
                onClick={async () => {
                  if (!title.trim()) {
                    toast.error(
                      "Meeting title is required",
                    );
                    return;
                  }

                  if (!date || !time) {
                    toast.error(
                      "Meeting date and time are required",
                    );
                    return;
                  }

                  const scheduledAt =
                    new Date(
                      `${date}T${time}`,
                    );

                  if (
                    Number.isNaN(
                      scheduledAt.getTime(),
                    )
                  ) {
                    toast.error(
                      "Invalid meeting date or time",
                    );
                    return;
                  }

                  if (
                    scheduledAt.getTime() <=
                    Date.now()
                  ) {
                    toast.error(
                      "Meeting must be scheduled for a future time",
                    );
                    return;
                  }

                  try {
                    setSaving(true);

                    await createCircleMeeting(
                      selectedCircleId,
                      {
                        title: title.trim(),
                        description:
                          description.trim(),
                        scheduledAt:
                          scheduledAt.toISOString(),
                      },
                    );

                    toast.success(
                      "Meeting scheduled successfully",
                    );

                    setDone(true);

                    setTitle("");
                    setDate("");
                    setTime("");
                    setDescription("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to schedule meeting",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving
                  ? "Scheduling..."
                  : "Schedule Meeting"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ManageCircleModal({
  trigger,
  circleId,
  circleName,
  circleDescription = "",
}: {
  trigger: ReactNode;
  circleId: string;
  circleName: string;
  circleDescription?: string;
}) {
  const [name, setName] =
    useState(circleName);

  const [description, setDescription] =
    useState(circleDescription);

  const [saving, setSaving] =
    useState(false);
    const [availableCircles, setAvailableCircles] =
  useState<Circle[]>([]);

const [selectedCircleId, setSelectedCircleId] =
  useState(circleId);

const [loadingCircles, setLoadingCircles] =
  useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="glass max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users
              className="text-primary h-4 w-4"
              aria-hidden
            />
            Manage Circle
          </DialogTitle>

          <DialogDescription>
            Manage settings for{" "}
            <strong>{circleName}</strong>.
            Member data shown here is never exposed
            in normal member views.
          </DialogDescription>
        </DialogHeader>

        {/* Edit Circle */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manage-circle-name">
              Circle name
            </Label>

            <Input
              id="manage-circle-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manage-circle-description">
              Description
            </Label>

            <Textarea
              id="manage-circle-description"
              rows={3}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className="resize-none"
            />
          </div>
        </div>

        {/* Privacy settings */}
        <div className="space-y-2">
          <PrivacyToggle
            label="Hide member count"
          />

          <PrivacyToggle
            label="Hide member directory"
          />

          <PrivacyToggle
            label="Hide online status"
          />

          <PrivacyToggle
            label="Restrict invitations"
            defaultChecked={false}
          />
        </div>

        {/* Member management */}
        <div className="border-border border-t pt-4">
          <CircleMemberManager
            circleId={circleId}
          />
        </div>

        {/* Leave Circle */}
        <div className="border-border border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive w-full"
            onClick={async () => {
              const confirmed =
                window.confirm(
                  "Are you sure you want to leave this Circle?",
                );

              if (!confirmed) {
                return;
              }

              try {
                await leaveCircle(
                  circleId,
                );

                toast.success(
                  "You have left the Circle.",
                );

                window.location.href =
                  "/circles";
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to leave Circle",
                );
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave Circle
          </Button>
        </div>
        {/* Delete Circle */}
        <div className="border-border border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive w-full"
            onClick={async () => {
              const confirmed =
                window.confirm(
                  "Are you sure you want to permanently delete this Circle? This action cannot be undone.",
                );

              if (!confirmed) {
                return;
              }

              try {
                await deleteCircle(
                  circleId,
                );

                toast.success(
                  "Circle deleted successfully.",
                );

                window.location.href =
                  "/circles";
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to delete Circle",
                );
              }
            }}
          >
            Delete Circle
          </Button>
        </div>
        <DialogFooter>
          <Button
            asChild
            variant="outline"
          >
            <a
              href={`/circles/${circleId}/members`}
            >
              Manage members
            </a>
          </Button>

          <Button
            disabled={saving}
            onClick={async () => {
              if (!name.trim()) {
                toast.error(
                  "Circle name is required",
                );
                return;
              }

              try {
                setSaving(true);

                await editCircle(
                  circleId,
                  {
                    name: name.trim(),
                    description:
                      description.trim(),
                  },
                );

                toast.success(
                  "Circle updated successfully",
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update Circle",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}