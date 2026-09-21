import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "@/socket";

import {
  createPeerConnection,
  getAudioStream,
  getVideoStream,
  stopMediaStream,
} from "@/features/calls/services/Webrtc";

import type {
  CallParticipant,
  CallState,
  CallType,
} from "@/features/calls/Types";

type IncomingCallData = {
  callId: string;
  callerId: string;
  callerName?: string;
  type: CallType;
  offer: RTCSessionDescriptionInit;
};

type AnsweredCallData = {
  callId: string;
  answer: RTCSessionDescriptionInit;
};

type IceCandidateData = {
  candidate: RTCIceCandidateInit;
};

type EndedCallData = {
  callId: string;
};

type RejectedCallData = {
  callId: string;
};

const initialCallState: CallState = {
  status: "idle",
  type: null,
  callId: null,
  participants: [],
  isMuted: false,
  isCameraOff: false,
};

export const useCall = () => {
  const [callState, setCallState] =
    useState<CallState>(initialCallState);

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const remoteStreamRef =
    useRef<MediaStream | null>(null);

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(null);

  const remoteUserIdRef =
    useRef<string | null>(null);

  const pendingOfferRef =
    useRef<RTCSessionDescriptionInit | null>(null);

  const cleanupCall = useCallback(() => {
    peerConnectionRef.current?.close();

    peerConnectionRef.current = null;

    stopMediaStream(
      localStreamRef.current,
    );

    localStreamRef.current = null;

    remoteStreamRef.current = null;

    remoteUserIdRef.current = null;

    pendingOfferRef.current = null;
  }, []);

  const resetCall = useCallback(() => {
    cleanupCall();

    setCallState(initialCallState);
  }, [cleanupCall]);

  /**
   * Start a new audio/video call
   */
  const startCall = useCallback(
    async (
      type: CallType,
      userId: string,
      userName: string,
    ) => {
      try {
        const stream =
          type === "video"
            ? await getVideoStream()
            : await getAudioStream();

        localStreamRef.current = stream;

        remoteUserIdRef.current = userId;

        const peerConnection =
          createPeerConnection(
            (candidate) => {
              socket.emit(
                "call:ice-candidate",
                {
                  userId,
                  candidate,
                },
              );
            },
            (event) => {
              const remoteStream =
                event.streams[0];

              if (remoteStream) {
                remoteStreamRef.current =
                  remoteStream;

                setCallState(
                  (previous) => ({
                    ...previous,
                    status: "connected",
                  }),
                );
              }
            },
          );

        stream
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(
              track,
              stream,
            );
          });

        peerConnectionRef.current =
          peerConnection;

        const offer =
          await peerConnection.createOffer();

        await peerConnection.setLocalDescription(
          offer,
        );

        const callId =
          crypto.randomUUID();

        setCallState({
          status: "calling",
          type,
          callId,
          participants: [
            {
              id: userId,
              name: userName,
            },
          ],
          isMuted: false,
          isCameraOff:
            type === "audio",
        });

        socket.emit("call:start", {
          callId,
          targetUserId: userId,
          type,
          offer,
        });
      } catch (error) {
        console.error(
          "Failed to start call:",
          error,
        );

        cleanupCall();

        setCallState(initialCallState);
      }
    },
    [cleanupCall],
  );

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(
    async () => {
      try {
        const offer =
          pendingOfferRef.current;

        const callerId =
          remoteUserIdRef.current;

        if (!offer || !callerId) {
          console.error(
            "Missing incoming call information",
          );
          return;
        }

        const type =
          callState.type || "audio";

        const stream =
          type === "video"
            ? await getVideoStream()
            : await getAudioStream();

        localStreamRef.current = stream;

        const peerConnection =
          createPeerConnection(
            (candidate) => {
              socket.emit(
                "call:ice-candidate",
                {
                  userId: callerId,
                  candidate,
                },
              );
            },
            (event) => {
              const remoteStream =
                event.streams[0];

              if (remoteStream) {
                remoteStreamRef.current =
                  remoteStream;

                setCallState(
                  (previous) => ({
                    ...previous,
                    status: "connected",
                  }),
                );
              }
            },
          );

        peerConnectionRef.current =
          peerConnection;

        stream
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(
              track,
              stream,
            );
          });

        await peerConnection.setRemoteDescription(
          offer,
        );

        const answer =
          await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
          answer,
        );

        socket.emit("call:answer", {
          callerId,
          callId: callState.callId,
          answer,
        });

        setCallState(
          (previous) => ({
            ...previous,
            status: "connected",
          }),
        );

        pendingOfferRef.current = null;
      } catch (error) {
        console.error(
          "Failed to accept call:",
          error,
        );

        cleanupCall();

        setCallState(initialCallState);
      }
    },
    [
      callState.callId,
      callState.type,
      cleanupCall,
    ],
  );

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(() => {
    const callerId =
      remoteUserIdRef.current;

    const callId =
      callState.callId;

    if (callerId && callId) {
      socket.emit("call:reject", {
        callId,
        callerId,
      });
    }

    resetCall();
  }, [
    callState.callId,
    resetCall,
  ]);

  /**
   * Mute/unmute microphone
   */
  const toggleMute = useCallback(() => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const audioTrack =
      stream.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    audioTrack.enabled =
      !audioTrack.enabled;

    setCallState(
      (previous) => ({
        ...previous,
        isMuted: !audioTrack.enabled,
      }),
    );
  }, []);

  /**
   * Turn camera on/off
   */
  const toggleCamera = useCallback(() => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const videoTrack =
      stream.getVideoTracks()[0];

    if (!videoTrack) {
      return;
    }

    videoTrack.enabled =
      !videoTrack.enabled;

    setCallState(
      (previous) => ({
        ...previous,
        isCameraOff:
          !videoTrack.enabled,
      }),
    );
  }, []);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    const targetUserId =
      remoteUserIdRef.current;

    const callId =
      callState.callId;

    if (callId) {
      socket.emit("call:end", {
        callId,
        targetUserId,
      });
    }

    resetCall();
  }, [
    callState.callId,
    resetCall,
  ]);

  /**
   * Listen for incoming calls and
   * other WebRTC signaling events.
   */
  useEffect(() => {
    const handleIncomingCall = (
      data: IncomingCallData,
    ) => {
      remoteUserIdRef.current =
        data.callerId;

      pendingOfferRef.current =
        data.offer;

      const caller: CallParticipant = {
        id: data.callerId,
        name:
          data.callerName ||
          "Velora User",
      };

      setCallState({
        status: "ringing",
        type: data.type,
        callId: data.callId,
        participants: [caller],
        isMuted: false,
        isCameraOff:
          data.type === "audio",
      });
    };

    const handleAnsweredCall = async (
      data: AnsweredCallData,
    ) => {
      if (
        data.callId !==
        callState.callId
      ) {
        return;
      }

      const peerConnection =
        peerConnectionRef.current;

      if (!peerConnection) {
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          data.answer,
        );

        setCallState(
          (previous) => ({
            ...previous,
            status: "connected",
          }),
        );
      } catch (error) {
        console.error(
          "Failed to set remote answer:",
          error,
        );
      }
    };

    const handleIceCandidate = async (
      data: IceCandidateData,
    ) => {
      const peerConnection =
        peerConnectionRef.current;

      if (!peerConnection) {
        return;
      }

      try {
        await peerConnection.addIceCandidate(
          data.candidate,
        );
      } catch (error) {
        console.error(
          "Failed to add ICE candidate:",
          error,
        );
      }
    };

    const handleCallEnded = (
      data: EndedCallData,
    ) => {
      if (
        data.callId !==
        callState.callId
      ) {
        return;
      }

      resetCall();
    };

    const handleCallRejected = (
      data: RejectedCallData,
    ) => {
      if (
        data.callId !==
        callState.callId
      ) {
        return;
      }

      resetCall();
    };

    socket.on(
      "call:incoming",
      handleIncomingCall,
    );

    socket.on(
      "call:answered",
      handleAnsweredCall,
    );

    socket.on(
      "call:ice-candidate",
      handleIceCandidate,
    );

    socket.on(
      "call:ended",
      handleCallEnded,
    );

    socket.on(
      "call:rejected",
      handleCallRejected,
    );

    return () => {
      socket.off(
        "call:incoming",
        handleIncomingCall,
      );

      socket.off(
        "call:answered",
        handleAnsweredCall,
      );

      socket.off(
        "call:ice-candidate",
        handleIceCandidate,
      );

      socket.off(
        "call:ended",
        handleCallEnded,
      );

      socket.off(
        "call:rejected",
        handleCallRejected,
      );
    };
  }, [
    callState.callId,
    resetCall,
  ]);

  /**
   * Make sure media is cleaned up
   * when the component using the hook
   * is unmounted.
   */
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callState,

    localStreamRef,

    remoteStreamRef,

    startCall,

    acceptCall,

    rejectCall,

    toggleMute,

    toggleCamera,

    endCall,
  };
};

