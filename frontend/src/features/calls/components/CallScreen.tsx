import {
  Mic,
  MicOff,
  PhoneOff,
  UserPlus,
  Video,
  VideoOff,
} from "lucide-react";

import { useEffect, useRef } from "react";

import type { CallState } from "../Types";

type CallScreenProps = {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onMute: () => void;
  onCamera: () => void;
  onInvite: () => void;
  onEnd: () => void;
};

export function CallScreen({
  callState,
  localStream,
  remoteStream,
  onMute,
  onCamera,
  onInvite,
  onEnd,
}: CallScreenProps) {
  const isVideo =
    callState.type === "video";

  const remoteAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const localVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const remoteAudioVolume = 0.8;

  useEffect(() => {
    if (
      remoteAudioRef.current &&
      remoteStream
    ) {
      remoteAudioRef.current.srcObject =
        remoteStream;

      remoteAudioRef.current.volume =
        remoteAudioVolume;

      void remoteAudioRef.current.play().catch(
        (error) => {
          console.error(
            "Unable to play remote audio:",
            error,
          );
        },
      );
    }
  }, [remoteStream]);

  useEffect(() => {
    if (
      remoteVideoRef.current &&
      remoteStream
    ) {
      remoteVideoRef.current.srcObject =
        remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (
      localVideoRef.current &&
      localStream
    ) {
      localVideoRef.current.srcObject =
        localStream;
    }
  }, [localStream]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      {/* Remote media */}

      {isVideo ? (
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />

          {!remoteStream ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">
                  {callState.participants[0]?.name
                    ?.slice(0, 2)
                    .toUpperCase() || "VC"}
                </div>

                <p className="mt-4 text-lg font-semibold">
                  {callState.participants[0]
                    ?.name || "Calling..."}
                </p>
              </div>
            </div>
          ) : null}

          {/* Local video preview */}

          {localStream ? (
            <div className="absolute right-5 top-20 h-32 w-24 overflow-hidden rounded-xl border border-white/20 bg-black shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">
              {callState.participants[0]?.name
                ?.slice(0, 2)
                .toUpperCase() || "VC"}
            </div>

            <p className="mt-4 text-lg font-semibold">
              {callState.participants[0]
                ?.name || "Calling..."}
            </p>
          </div>
        </div>
      )}

      {/* Hidden audio element for audio calls */}

      {!isVideo ? (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          controls={false}
        />
      ) : null}

      {/* Header */}

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold">
            {isVideo
              ? "Video call"
              : "Audio call"}
          </p>

          <p className="text-xs text-white/60">
            {callState.status === "calling"
              ? "Calling..."
              : callState.status === "connected"
                ? "Connected"
                : "Connecting..."}
          </p>
        </div>

        <button
          type="button"
          onClick={onInvite}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {/* Controls */}

      <div className="relative z-10 flex items-center justify-center gap-3 pb-10">
        <button
          type="button"
          onClick={onMute}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label={
            callState.isMuted
              ? "Unmute microphone"
              : "Mute microphone"
          }
        >
          {callState.isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        {isVideo ? (
          <button
            type="button"
            onClick={onCamera}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label={
              callState.isCameraOff
                ? "Turn camera on"
                : "Turn camera off"
            }
          >
            {callState.isCameraOff ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onInvite}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Invite people"
        >
          <UserPlus className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onEnd}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}