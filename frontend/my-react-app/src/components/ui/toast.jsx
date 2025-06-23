import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const toastVariants = cva(
  "fixed top-0 right-0 m-4 flex items-center gap-2 rounded-md border p-4 shadow-md transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-green-100 border-green-500 text-green-900",
        destructive: "bg-red-100 border-red-500 text-red-900",
        warning: "bg-yellow-100 border-yellow-500 text-yellow-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = ({ variant, title, description, onClose }) => {
  return (
    <div className={cn(toastVariants({ variant }))}>
      <div className="flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {description && <p className="text-sm">{description}</p>}
      </div>
      <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export { Toast, toastVariants };