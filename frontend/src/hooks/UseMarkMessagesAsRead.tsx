import { useCallback } from "react";

import socket from "@/socket";

type UseMarkMessagesAsReadProps = {
  activeId: string | null;
};

export function useMarkMessagesAsRead({
  activeId,
}: UseMarkMessagesAsReadProps) {
  const markMessagesAsRead = useCallback(() => {
    if (!activeId) {
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem("user") || "{}",
    );

    const currentUserId =
      currentUser.id || currentUser._id;

    if (!currentUserId) {
      return;
    }

    socket.emit("markMessagesAsRead", {
      conversationId: activeId,
      userId: currentUserId,
    });
  }, [activeId]);

  return {
    markMessagesAsRead,
  };
}
