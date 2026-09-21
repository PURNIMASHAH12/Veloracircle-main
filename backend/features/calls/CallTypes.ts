export type CallType = "audio" | "video";

export type CallSignal = {
  callId: string;
  callerId: string;
  callerName: string;
  targetUserId: string;
  type: CallType;
  offer?: RTCSessionDescriptionInit;
};