import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import socket, { connectSocket } from "@/socket";

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
    senderId?: string;
};

type EndedCallData = {
    callId: string;
};

type RejectedCallData = {
    callId: string;
};

type InvitedCallData = {
    callId: string;
    inviterId: string;
    inviterName: string;
    type: CallType;
};

type JoinRequestData = {
    callId: string;
    userId: string;
    userName: string;
};

type JoinOfferData = {
    callId: string;
    callerId: string;
    offer: RTCSessionDescriptionInit;
};

type JoinAnswerData = {
    callId: string;
    userId: string;
    answer: RTCSessionDescriptionInit;
};

type PendingIncomingCall = {
    callId: string;
    callerId: string;
    callerName: string;
    type: CallType;
    offer: RTCSessionDescriptionInit;
};

type PendingGroupInvite = {
    callId: string;
    inviterId: string;
    inviterName: string;
    type: CallType;
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
            useEffect(() => {
        connectSocket();

        return () => {
            socket.disconnect();
        };
    }, []);

    /*
     * One local stream is shared by every
     * peer connection in a group call.
     */
    const localStreamRef =
        useRef<MediaStream | null>(null);

    /*
     * Existing 1-to-1 remote stream ref.
     *
     * We keep this so the current CallScreen
     * continues to work.
     */
    const remoteStreamRef =
        useRef<MediaStream | null>(null);

    /*
     * All remote streams in a group call.
     *
     * Key = remote user's ID.
     */
    const remoteStreamsRef =
        useRef<Map<string, MediaStream>>(
            new Map(),
        );

    /*
     * Existing 1-to-1 peer connection ref.
     *
     * Kept for compatibility.
     */
    const peerConnectionRef =
        useRef<RTCPeerConnection | null>(null);

    /*
     * Group-call peer connections.
     *
     * One RTCPeerConnection per remote user.
     */
    const peerConnectionsRef =
        useRef<Map<string, RTCPeerConnection>>(
            new Map(),
        );

    const remoteUserIdRef =
        useRef<string | null>(null);

    const pendingOfferRef =
        useRef<RTCSessionDescriptionInit | null>(
            null,
        );

    const pendingIncomingCallRef =
        useRef<PendingIncomingCall | null>(
            null,
        );

    /*
     * Used when accepting an invitation to
     * an already-running call.
     */
    const pendingGroupInviteRef =
        useRef<PendingGroupInvite | null>(
            null,
        );

    /*
     * Keep the current call ID available to
     * socket handlers without depending on
     * React state timing.
     */
    const callIdRef =
        useRef<string | null>(null);

    /*
     * Add a participant to the call state
     * only if they are not already present.
     */
    const addParticipant = useCallback(
        (
            participant: CallParticipant,
        ) => {
            setCallState((previous) => {
                const alreadyExists =
                    previous.participants.some(
                        (item) =>
                            item.id ===
                            participant.id,
                    );

                if (alreadyExists) {
                    return previous;
                }

                return {
                    ...previous,
                    participants: [
                        ...previous.participants,
                        participant,
                    ],
                };
            });
        },
        [],
    );

    /*
     * Remove one participant.
     */
    const removeParticipant = useCallback(
        (userId: string) => {
            setCallState((previous) => ({
                ...previous,
                participants:
                    previous.participants.filter(
                        (item) =>
                            item.id !== userId,
                    ),
            }));
        },
        [],
    );

    /*
     * Create a peer connection for one
     * specific remote participant.
     */
    const createGroupPeerConnection =
        useCallback(
            (
                userId: string,
            ): RTCPeerConnection => {
                const existing =
                    peerConnectionsRef.current.get(
                        userId,
                    );

                if (existing) {
                    return existing;
                }

                const peerConnection =
                    createPeerConnection(
                        (candidate) => {
                            /*
                             * Identify the logged-in user
                             * as the sender of this ICE
                             * candidate.
                             */
                            const currentUser =
                                JSON.parse(
                                    localStorage.getItem(
                                        "user",
                                    ) || "{}",
                                );

                            socket.emit(
                                "call:ice-candidate",
                                {
                                    userId,
                                    senderId:
                                        currentUser.id ||
                                        currentUser._id,
                                    candidate,
                                },
                            );
                        },
                        (event) => {
                            const remoteStream =
                                event.streams[0];

                            if (!remoteStream) {
                                return;
                            }

                            remoteStreamsRef.current.set(
                                userId,
                                remoteStream,
                            );

                            /*
                             * Keep the old ref pointing
                             * to the first available
                             * remote stream.
                             */
                            if (
                                !remoteStreamRef.current
                            ) {
                                remoteStreamRef.current =
                                    remoteStream;
                            }

                            setCallState(
                                (previous) => ({
                                    ...previous,
                                    status:
                                        "connected",
                                }),
                            );
                        },
                    );

                /*
                 * Add the local tracks to this
                 * participant's connection.
                 */
                if (localStreamRef.current) {
                    localStreamRef.current
                        .getTracks()
                        .forEach((track) => {
                            peerConnection.addTrack(
                                track,
                                localStreamRef.current!,
                            );
                        });
                }

                peerConnectionsRef.current.set(
                    userId,
                    peerConnection,
                );

                return peerConnection;
            },
            [],
        );

    /*
     * Close one participant's peer connection.
     */
    const closePeerConnection = useCallback(
        (userId: string) => {
            const peerConnection =
                peerConnectionsRef.current.get(
                    userId,
                );

            peerConnection?.close();

            peerConnectionsRef.current.delete(
                userId,
            );

            remoteStreamsRef.current.delete(
                userId,
            );

            if (
                remoteUserIdRef.current ===
                userId
            ) {
                remoteUserIdRef.current =
                    null;
                remoteStreamRef.current =
                    null;
            }

            removeParticipant(userId);
        },
        [removeParticipant],
    );

    const cleanupCall = useCallback(() => {
        /*
         * Close all group peer connections.
         */
        peerConnectionsRef.current.forEach(
            (peerConnection) => {
                peerConnection.close();
            },
        );

        peerConnectionsRef.current.clear();

        /*
         * Also close the original peer
         * connection reference.
         */
        peerConnectionRef.current?.close();

        peerConnectionRef.current = null;

        stopMediaStream(
            localStreamRef.current,
        );

        localStreamRef.current = null;

        remoteStreamRef.current = null;

        remoteStreamsRef.current.clear();

        remoteUserIdRef.current = null;

        pendingOfferRef.current = null;

        pendingIncomingCallRef.current =
            null;

        pendingGroupInviteRef.current = null;

        callIdRef.current = null;
    }, []);

    const resetCall = useCallback(() => {
        cleanupCall();

        setCallState(initialCallState);
    }, [cleanupCall]);

    /**
     * Start a new audio/video call.
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

                localStreamRef.current =
                    stream;

                remoteUserIdRef.current =
                    userId;

                const peerConnection =
                    createPeerConnection(
                        (candidate) => {
                            const currentUser =
                                JSON.parse(
                                    localStorage.getItem(
                                        "user",
                                    ) || "{}",
                                );

                            socket.emit(
                                "call:ice-candidate",
                                {
                                    userId,
                                    senderId:
                                        currentUser.id ||
                                        currentUser._id,
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

                                remoteStreamsRef.current.set(
                                    userId,
                                    remoteStream,
                                );

                                setCallState(
                                    (previous) => ({
                                        ...previous,
                                        status:
                                            "connected",
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

                /*
                 * Also store it in the group map.
                 * This allows the first participant
                 * to behave like a group participant.
                 */
                peerConnectionsRef.current.set(
                    userId,
                    peerConnection,
                );

                const offer =
                    await peerConnection.createOffer();

                await peerConnection.setLocalDescription(
                    offer,
                );

                const callId =
                    crypto.randomUUID();

                callIdRef.current = callId;

                const currentUser =
                    JSON.parse(
                        localStorage.getItem(
                            "user",
                        ) || "{}",
                    );

                const currentUserName =
                    currentUser.name ||
                    "Velora User";

                console.log(
                    "CALL DEBUG - Person being called:",
                    userName,
                );

                console.log(
                    "CALL DEBUG - Logged-in user:",
                    currentUser,
                );

                console.log(
                    "CALL DEBUG - Caller name being sent:",
                    currentUserName,
                );

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
                    callerName:
                        currentUserName,
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
     * Accept a normal incoming 1-to-1 call
     * OR accept an invitation to an existing
     * group call.
     */
    const acceptCall = useCallback(
        async () => {
            try {
                /*
                 * -------------------------------------------------
                 * GROUP CALL INVITATION
                 * -------------------------------------------------
                 */
                const groupInvite =
                    pendingGroupInviteRef.current;

                if (groupInvite) {
                    const currentUser =
                        JSON.parse(
                            localStorage.getItem(
                                "user",
                            ) || "{}",
                        );

                    const currentUserId =
                        currentUser.id ||
                        currentUser._id;

                    const currentUserName =
                        currentUser.name ||
                        "Velora User";

                    callIdRef.current =
                        groupInvite.callId;

                    setCallState((previous) => ({
                        ...previous,
                        status: "calling",
                        callId:
                            groupInvite.callId,
                        type:
                            groupInvite.type,
                    }));

                    socket.emit(
                        "call:join-request",
                        {
                            callId:
                                groupInvite.callId,
                            inviterId:
                                groupInvite.inviterId,
                            userId:
                                currentUserId,
                            userName:
                                currentUserName,
                        },
                    );

                    pendingGroupInviteRef.current =
                        null;

                    return;
                }

                /*
                 * -------------------------------------------------
                 * NORMAL 1-TO-1 CALL
                 * -------------------------------------------------
                 */
                const pendingCall =
                    pendingIncomingCallRef.current;

                if (!pendingCall) {
                    console.error(
                        "Missing incoming call information",
                        {
                            pendingCall,
                            callState,
                        },
                    );

                    return;
                }

                const {
                    offer,
                    callerId,
                    callId,
                    type,
                } = pendingCall;

                remoteUserIdRef.current =
                    callerId;

                pendingOfferRef.current =
                    offer;

                callIdRef.current = callId;

                const stream =
                    type === "video"
                        ? await getVideoStream()
                        : await getAudioStream();

                localStreamRef.current =
                    stream;

                const peerConnection =
                    createPeerConnection(
                        (candidate) => {
                            const currentUser =
                                JSON.parse(
                                    localStorage.getItem(
                                        "user",
                                    ) || "{}",
                                );

                            socket.emit(
                                "call:ice-candidate",
                                {
                                    userId:
                                        callerId,
                                    senderId:
                                        currentUser.id ||
                                        currentUser._id,
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

                                remoteStreamsRef.current.set(
                                    callerId,
                                    remoteStream,
                                );

                                setCallState(
                                    (previous) => ({
                                        ...previous,
                                        status:
                                            "connected",
                                    }),
                                );
                            }
                        },
                    );

                peerConnectionRef.current =
                    peerConnection;

                peerConnectionsRef.current.set(
                    callerId,
                    peerConnection,
                );

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
                    callId,
                    answer,
                });

                setCallState(
                    (previous) => ({
                        ...previous,
                        status: "connected",
                    }),
                );

                pendingIncomingCallRef.current =
                    null;

                pendingOfferRef.current =
                    null;
            } catch (error) {
                console.error(
                    "Failed to accept call:",
                    error,
                );

                cleanupCall();

                setCallState(initialCallState);
            }
        },
        [callState, cleanupCall],
    );

    /**
     * Reject an incoming call.
     */
    const rejectCall = useCallback(() => {
        /*
         * Group invitation.
         */
        const groupInvite =
            pendingGroupInviteRef.current;

        if (groupInvite) {
            socket.emit("call:reject", {
                callId:
                    groupInvite.callId,
                callerId:
                    groupInvite.inviterId,
            });

            pendingGroupInviteRef.current =
                null;

            setCallState(initialCallState);

            return;
        }

        /*
         * Normal incoming call.
         */
        const pendingCall =
            pendingIncomingCallRef.current;

        const callerId =
            pendingCall?.callerId ||
            remoteUserIdRef.current;

        const callId =
            pendingCall?.callId ||
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
     * Invite users to the active call.
     *
     * The actual WebRTC negotiation starts
     * after the invited user accepts.
     */
    const inviteUsers = useCallback(
        (
            users: {
                id: string;
                name: string;
            }[],
        ) => {
            if (
                !callState.callId ||
                !callState.type ||
                users.length === 0
            ) {
                return;
            }

            const currentUser =
                JSON.parse(
                    localStorage.getItem(
                        "user",
                    ) || "{}",
                );

            const currentUserName =
                currentUser.name ||
                "Velora User";

            users.forEach((user) => {
                socket.emit(
                    "call:invite",
                    {
                        callId:
                            callState.callId,
                        targetUserId:
                            user.id,
                        callerName:
                            currentUserName,
                        type:
                            callState.type,
                    },
                );
            });
        },
        [
            callState.callId,
            callState.type,
        ],
    );

    /**
     * Mute/unmute microphone.
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
                isMuted:
                    !audioTrack.enabled,
            }),
        );
    }, []);

    /**
     * Turn camera on/off.
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
     * End the current call.
     */
    const endCall = useCallback(() => {
        const callId =
            callState.callId;

        if (callId) {
            /*
             * Notify every current participant.
             */
            callState.participants.forEach(
                (participant) => {
                    socket.emit("call:end", {
                        callId,
                        targetUserId:
                            participant.id,
                    });
                },
            );
        }

        resetCall();
    }, [
        callState.callId,
        callState.participants,
        resetCall,
    ]);

    /**
     * Listen for incoming calls and
     * WebRTC signaling events.
     */
    useEffect(() => {
        /*
         * ---------------------------------------------
         * Normal incoming 1-to-1 call
         * ---------------------------------------------
         */
        const handleIncomingCall = (
            data: IncomingCallData,
        ) => {
            console.log(
                "CALL DEBUG - Incoming call:",
                data,
            );

            const callerName =
                data.callerName ||
                "Velora User";

            pendingIncomingCallRef.current = {
                callId: data.callId,
                callerId: data.callerId,
                callerName,
                type: data.type,
                offer: data.offer,
            };

            remoteUserIdRef.current =
                data.callerId;

            pendingOfferRef.current =
                data.offer;

            callIdRef.current =
                data.callId;

            const caller: CallParticipant = {
                id: data.callerId,
                name: callerName,
            };

            console.log(
                "CALL DEBUG - Caller name received:",
                callerName,
            );

            console.log(
                "CALL DEBUG - Caller ID received:",
                data.callerId,
            );

            console.log(
                "CALL DEBUG - Offer received:",
                Boolean(data.offer),
            );

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

        /*
         * ---------------------------------------------
         * Invitation to an existing call
         * ---------------------------------------------
         */
        const handleCallInvited = (
            data: InvitedCallData,
        ) => {
            console.log(
                "CALL DEBUG - Call invitation:",
                data,
            );

            pendingGroupInviteRef.current = {
                callId: data.callId,
                inviterId:
                    data.inviterId,
                inviterName:
                    data.inviterName,
                type: data.type,
            };

            callIdRef.current =
                data.callId;

            const inviter: CallParticipant = {
                id: data.inviterId,
                name:
                    data.inviterName ||
                    "Velora User",
            };

            setCallState({
                status: "ringing",
                type: data.type,
                callId: data.callId,
                participants: [inviter],
                isMuted: false,
                isCameraOff:
                    data.type === "audio",
            });
        };

        /*
         * ---------------------------------------------
         * Existing caller receives a request
         * from an invited participant.
         * ---------------------------------------------
         */
        const handleJoinRequest = async (
            data: JoinRequestData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
            ) {
                return;
            }

            try {
                console.log(
                    "CALL DEBUG - Join request:",
                    data,
                );

                const peerConnection =
                    createGroupPeerConnection(
                        data.userId,
                    );

                const offer =
                    await peerConnection.createOffer();

                await peerConnection.setLocalDescription(
                    offer,
                );

                socket.emit(
                    "call:join-offer",
                    {
                        callId:
                            data.callId,
                        targetUserId:
                            data.userId,
                        offer,
                    },
                );
            } catch (error) {
                console.error(
                    "Failed to create group call offer:",
                    error,
                );
            }
        };

        /*
         * ---------------------------------------------
         * Invited participant receives the offer.
         * ---------------------------------------------
         */
        const handleJoinOffer = async (
            data: JoinOfferData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
            ) {
                return;
            }

            try {
                console.log(
                    "CALL DEBUG - Join offer received:",
                    data,
                );

                const peerConnection =
                    createGroupPeerConnection(
                        data.callerId,
                    );

                await peerConnection.setRemoteDescription(
                    data.offer,
                );

                const answer =
                    await peerConnection.createAnswer();

                await peerConnection.setLocalDescription(
                    answer,
                );

                socket.emit(
                    "call:join-answer",
                    {
                        callId:
                            data.callId,
                        callerId:
                            data.callerId,
                        answer,
                    },
                );

                setCallState(
                    (previous) => ({
                        ...previous,
                        status:
                            "connected",
                    }),
                );
            } catch (error) {
                console.error(
                    "Failed to accept group call offer:",
                    error,
                );
            }
        };

        /*
         * ---------------------------------------------
         * Existing caller receives the answer
         * from an invited participant.
         * ---------------------------------------------
         */
        const handleJoinAnswer = async (
            data: JoinAnswerData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
            ) {
                return;
            }

            const peerConnection =
                peerConnectionsRef.current.get(
                    data.userId,
                );

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
                        status:
                            "connected",
                    }),
                );
            } catch (error) {
                console.error(
                    "Failed to set group call answer:",
                    error,
                );
            }
        };

        /*
         * ---------------------------------------------
         * Normal 1-to-1 answer
         * ---------------------------------------------
         */
        const handleAnsweredCall = async (
            data: AnsweredCallData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
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
                        status:
                            "connected",
                    }),
                );
            } catch (error) {
                console.error(
                    "Failed to set remote answer:",
                    error,
                );
            }
        };

        /*
         * ---------------------------------------------
         * ICE candidates
         * ---------------------------------------------
         */
        const handleIceCandidate = async (
            data: IceCandidateData,
        ) => {
            /*
             * If senderId is available, use it to
             * find the exact peer connection that
             * belongs to that remote participant.
             */
            if (data.senderId) {
                const groupPeer =
                    peerConnectionsRef.current.get(
                        data.senderId,
                    );

                if (groupPeer) {
                    try {
                        await groupPeer.addIceCandidate(
                            data.candidate,
                        );
                        return;
                    } catch (error) {
                        console.error(
                            "Failed to add group ICE candidate:",
                            error,
                        );
                    }
                }

                /*
                 * Normal 1-to-1 call may also use
                 * the sender ID as the remote user's ID.
                 */
                if (
                    remoteUserIdRef.current ===
                    data.senderId
                ) {
                    const normalPeer =
                        peerConnectionRef.current;

                    if (normalPeer) {
                        try {
                            await normalPeer.addIceCandidate(
                                data.candidate,
                            );
                            return;
                        } catch (error) {
                            console.error(
                                "Failed to add normal ICE candidate:",
                                error,
                            );
                        }
                    }
                }
            }

            /*
             * Backward-compatible fallback.
             *
             * This keeps existing 1-to-1 behavior
             * working if senderId is unavailable.
             */
            const normalPeer =
                peerConnectionRef.current;

            if (normalPeer) {
                try {
                    await normalPeer.addIceCandidate(
                        data.candidate,
                    );
                    return;
                } catch {
                    /*
                     * Try group connections below.
                     */
                }
            }

            /*
             * Final fallback for older signaling data.
             */
            for (const peerConnection of peerConnectionsRef.current.values()) {
                try {
                    await peerConnection.addIceCandidate(
                        data.candidate,
                    );
                    return;
                } catch {
                    /*
                     * Candidate belongs to another peer.
                     */
                }
            }
        };

        /*
         * ---------------------------------------------
         * Call ended
         * ---------------------------------------------
         */
        const handleCallEnded = (
            data: EndedCallData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
            ) {
                return;
            }

            resetCall();
        };

        /*
         * ---------------------------------------------
         * Call rejected
         * ---------------------------------------------
         */
        const handleCallRejected = (
            data: RejectedCallData,
        ) => {
            if (
                data.callId !==
                callIdRef.current
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
            "call:invited",
            handleCallInvited,
        );

        socket.on(
            "call:join-request",
            handleJoinRequest,
        );

        socket.on(
            "call:join-offer",
            handleJoinOffer,
        );

        socket.on(
            "call:join-answer",
            handleJoinAnswer,
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
                "call:invited",
                handleCallInvited,
            );

            socket.off(
                "call:join-request",
                handleJoinRequest,
            );

            socket.off(
                "call:join-offer",
                handleJoinOffer,
            );

            socket.off(
                "call:join-answer",
                handleJoinAnswer,
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
        createGroupPeerConnection,
        resetCall,
    ]);

    /*
     * Cleanup when the hook is unmounted.
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

        remoteStreamsRef,

        startCall,

        acceptCall,

        rejectCall,

        inviteUsers,

        toggleMute,

        toggleCamera,

        endCall,
    };
};