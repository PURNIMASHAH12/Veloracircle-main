import { useEffect } from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";

import socket from "@/socket";

type RealtimeMessage = {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  text: string;
  createdAt: string;
  readBy?: string[];
};

type UseRealtimeMessagesProps = {
  activeId: string | null;
  setBackendMessages: Dispatch<
    SetStateAction<RealtimeMessage[]>
  >;
  onIncomingMessage?: () => void;
};

export function useRealtimeMessages({
  activeId,
  setBackendMessages,
  onIncomingMessage,
}: UseRealtimeMessagesProps) {
  useEffect(() => {
    if (!activeId) {
      return;
    }

    const handleNewMessage = (
      message: RealtimeMessage,
    ) => {
      if (message.conversation !== activeId) {
        return;
      }

      setBackendMessages((previous) => {
        const alreadyExists = previous.some(
          (existingMessage) =>
            existingMessage._id === message._id,
        );

        if (alreadyExists) {
          return previous;
        }

        return [...previous, message];
      });

      onIncomingMessage?.();
    };

    socket.on(
      "newMessage",
      handleNewMessage,
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage,
      );
    };
  }, [
    activeId,
    setBackendMessages,
    onIncomingMessage,
  ]);
}


