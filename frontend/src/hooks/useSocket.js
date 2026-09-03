import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Module-level singleton: every component that needs realtime updates
// shares one WebSocket connection instead of each opening its own.
let socket = null;
function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

/**
 * Subscribes to the backend's `inventory_updated` event, emitted only
 * after a stock-changing DB transaction has committed. Pass a
 * useCallback-memoized handler so the effect doesn't tear down and
 * resubscribe on every render.
 */
export function useInventoryUpdates(onUpdate) {
  useEffect(() => {
    const s = getSocket();
    s.on('inventory_updated', onUpdate);
    return () => s.off('inventory_updated', onUpdate);
  }, [onUpdate]);
}
