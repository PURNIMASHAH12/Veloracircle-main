import { useEffect, useState } from "react";
import { Loader2, Shield, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addCircleMember,
  demoteCircleAdmin,
  getCircleMembers,
  promoteCircleAdmin,
  removeCircleMember,
  type CircleMember,
} from "@/lib/circle-member-api";

type CircleMemberManagerProps = {
  circleId: string;
};

export function CircleMemberManager({
  circleId,
}: CircleMemberManagerProps) {
  const [members, setMembers] =
    useState<CircleMember[]>([]);

  const [userId, setUserId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [actionUserId, setActionUserId] =
    useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);

      const data =
        await getCircleMembers(circleId);

      setMembers(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load members",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [circleId]);

  const handleAddMember = async () => {
    if (!userId.trim()) {
      toast.error("Enter a user ID");
      return;
    }

    try {
      setAdding(true);

      await addCircleMember(
        circleId,
        userId.trim(),
      );

      toast.success(
        "Member added successfully",
      );

      setUserId("");

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add member",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await removeCircleMember(
        circleId,
        memberId,
      );

      toast.success(
        "Member removed successfully",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove member",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handlePromote = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await promoteCircleAdmin(
        circleId,
        memberId,
      );

      toast.success(
        "Member promoted to Circle Admin",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to promote member",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleDemote = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await demoteCircleAdmin(
        circleId,
        memberId,
      );

      toast.success(
        "Circle Admin demoted",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to demote admin",
      );
    } finally {
      setActionUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Add member
        </p>

        <div className="flex gap-2">
          <Input
            value={userId}
            onChange={(event) =>
              setUserId(event.target.value)
            }
            placeholder="Enter user ID"
          />

          <Button
            onClick={handleAddMember}
            disabled={adding}
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Circle members
        </p>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No members found.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isProcessing =
                actionUserId === member._id;

              return (
                <div
                  key={member._id}
                  className="border-border bg-surface-2/40 flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>

                    <p className="text-muted-foreground truncate text-xs">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      onClick={() =>
                        handlePromote(
                          member._id,
                        )
                      }
                      title="Promote to admin"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      onClick={() =>
                        handleDemote(
                          member._id,
                        )
                      }
                      title="Demote admin"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      onClick={() =>
                        handleRemoveMember(
                          member._id,
                        )
                      }
                      title="Remove member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}