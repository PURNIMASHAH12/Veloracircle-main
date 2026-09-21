import { useCallback, useEffect } from "react";

import {
  messageSocket,
  connectMessageSocket,
} from "@/socket";

type UseMarkMessagesAsReadProps = {
  activeId: string | null;
};

export function useMarkMessagesAsRead({
  activeId,
}: UseMarkMessagesAsReadProps) {
  useEffect(() => {
    connectMessageSocket();

    return () => {
      messageSocket.disconnect();
    };
  }, []);

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

    messageSocket.emit("markMessagesAsRead", {
      conversationId: activeId,
      userId: currentUserId,
    });
  }, [activeId]);

  return {
    markMessagesAsRead,
  };
}