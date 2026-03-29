"use client";

import {
  CheckmarkCircle02Icon,
  InformationSquareIcon,
  Loading02Icon,
  CancelCircleIcon,
  AlertCircleIcon,
} from "hugeicons-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      richColors
      closeButton={false}
      duration={4000}
      icons={{
        success: <CheckmarkCircle02Icon size={16} />,
        info: <InformationSquareIcon size={16} />,
        warning: <AlertCircleIcon size={16} />,
        error: <CancelCircleIcon size={16} />,
        loading: <Loading02Icon size={16} className="animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
