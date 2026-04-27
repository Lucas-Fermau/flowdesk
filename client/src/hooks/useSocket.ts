'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL, tokenStore } from '../services/api';

let sharedSocket: Socket | null = null;
const sharedListeners = new Map<string, Set<(payload: unknown) => void>>();

function ensureSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (sharedSocket && sharedSocket.connected) return sharedSocket;
  if (sharedSocket) return sharedSocket;

  const token = tokenStore.getAccess();
  if (!token) return null;

  sharedSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 3,
    timeout: 5000,
  });

  sharedSocket.on('connect_error', () => {
    // Graceful degradation: socket fails silently in serverless environments
  });

  return sharedSocket;
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedListeners.clear();
  }
}

export function useSocket() {
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    ref.current = ensureSocket();
  }, []);

  return ref.current;
}

interface SocketEventOptions {
  event: string;
  callback: (payload: unknown) => void;
  enabled?: boolean;
}

export function useSocketEvent({ event, callback, enabled = true }: SocketEventOptions) {
  useEffect(() => {
    if (!enabled) return;
    const socket = ensureSocket();
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback, enabled]);
}

export function joinProjectRoom(projectId: string) {
  const socket = ensureSocket();
  if (!socket) return;
  if (socket.connected) socket.emit('project:join', projectId);
  else socket.once('connect', () => socket.emit('project:join', projectId));
}

export function leaveProjectRoom(projectId: string) {
  if (!sharedSocket) return;
  if (sharedSocket.connected) sharedSocket.emit('project:leave', projectId);
}
