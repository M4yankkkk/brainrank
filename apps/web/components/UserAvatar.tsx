"use client";

import { useState } from "react";
import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import type { Expression } from "blobatar/expression";
import { CrownIcon } from "./Icons";

export interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  animate?: "hover" | "always" | false;
  interactiveGaze?: boolean;
  expression?: Expression;
  background?: "squircle" | "circle" | "square" | false;
  crown?: boolean;
  className?: string;
  title?: string;
}

export function UserAvatar({
  name,
  src,
  size = 34,
  animate = "hover",
  interactiveGaze = false,
  expression,
  background = "circle",
  crown = false,
  className = "",
  title
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = (name && name.trim().length > 0) ? name.trim() : "player";

  // If interactive gaze is enabled, track pointer
  const { ref: gazeRef } = useGaze(
    interactiveGaze ? { travel: 3, lookAt: "pointer" } : undefined
  );

  const showCustomImage = Boolean(src && !imageFailed);

  return (
    <div
      className={`relative inline-flex flex-none items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title={title ?? displayName}
    >
      {showCustomImage ? (
        <img
          src={src!}
          alt={displayName}
          onError={() => setImageFailed(true)}
          className="h-full w-full rounded-full object-cover shadow-sm"
        />
      ) : animate ? (
        <Blobatar
          ref={interactiveGaze ? gazeRef : undefined}
          name={displayName}
          size={size}
          animate={animate}
          background={background}
          expression={expression}
          title={title ?? displayName}
          className="h-full w-full drop-shadow-sm transition-transform duration-200"
        />
      ) : (
        <Blobatar
          name={displayName}
          size={size}
          background={background}
          expression={expression}
          title={title ?? displayName}
          className="h-full w-full drop-shadow-sm"
        />
      )}

      {crown && (
        <span
          className="pointer-events-none absolute -right-1.5 -top-2.5 z-10 drop-shadow-md animate-bounce"
          style={{ animationDuration: "2s" }}
          aria-label="Rank 1 Champion"
        >
          <CrownIcon className="h-4 w-4 text-amber-400" />
        </span>
      )}
    </div>
  );
}
