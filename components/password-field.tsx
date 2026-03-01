"use client";

import { useState } from "react";
import type { ComponentProps } from "react";

type PasswordFieldProps = Omit<ComponentProps<"input">, "type">;

export function PasswordField({
  className,
  disabled,
  ...props
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        disabled={disabled}
        aria-label={isVisible ? "Skrýt heslo" : "Zobrazit heslo"}
        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-cyan-100/75 transition-colors hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isVisible ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 102.8 2.8" />
            <path d="M9.9 5.1A10.5 10.5 0 0112 5c5.5 0 9.8 5.2 10 5.4.1.2.1.4 0 .6-.1.2-1.4 1.8-3.5 3.2" />
            <path d="M14.1 18.9c-.7.1-1.4.1-2.1.1-5.5 0-9.8-5.2-10-5.4a.6.6 0 010-.6 17.4 17.4 0 013.8-3.5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M2 12s3.7-6.8 10-6.8S22 12 22 12s-3.7 6.8-10 6.8S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
