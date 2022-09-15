import React, { useCallback } from "react";
import type { PropsWithChildren, IframeHTMLAttributes } from "react";
import { useHost } from "../hooks/useHost.js";

type FrameProps = IframeHTMLAttributes<HTMLIFrameElement>;

/** @public */
export interface GuestUIProps extends FrameProps {
  guestId: string;
  /**
   * Receives the Penpal context when the frame is mounted.
   */
  onConnect: () => unknown;
  /**
   * Called when the frame disconnects and unmounts.
   */
  onDisconnect: () => unknown;
  /**
   * Called when the connection process throws an exception
   */
  onConnectionError?: (error: Error) => void;
  /**
   * Optional custom URL or path.
   */
  src: string;
}

const defaultFrameProps: FrameProps = {
  width: "100%",
  height: "100%",
  sandbox: "allow-scripts",
  style: {
    border: "none",
  },
};

/**
 * TODO: Document GuestUI.tsx
 * @public
 */
export function GuestUIFrame({
  guestId,
  src = "",
  onConnect,
  onDisconnect,
  onConnectionError,
  ...customFrameProps
}: PropsWithChildren<GuestUIProps>) {
  const { host } = useHost();
  if (!host) {
    return null;
  }
  const guest = host.guests.get(guestId);
  const frameUrl = new URL(src, guest.url.href);

  const ref = useCallback((iframe) => {
    const connection = guest.attachUI(iframe);

    connection.promise
      .then(() => {
        if (onConnect) {
          onConnect();
        }
      })
      .catch((error: Error) => {
        if (onConnectionError) onConnectionError(error);
        else throw error;
      });

    return () => {
      connection.destroy();
      if (onDisconnect) onDisconnect();
    };
  }, []);

  const frameProps = { ...defaultFrameProps, ...customFrameProps };

  return (
    <iframe
      ref={ref}
      src={frameUrl.href}
      name={`uix-guest-${guest.id}`}
      {...frameProps}
    />
  );
}
export default GuestUIFrame;
