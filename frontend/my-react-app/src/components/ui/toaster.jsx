import * as React from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const Toaster = React.forwardRef(({ className }, ref) => {
  const { toasts } = useToast()

  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-24 right-4 z-50 space-y-2",
        className
      )}
    >
      {toasts
        .filter((toast) => toast.id && toast.title) 
        .map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "min-w-[250px] rounded-md border bg-white p-4 shadow-lg transition-all duration-300 ease-in-out",
              toast.variant === "destructive" && "border-red-500 bg-red-100 text-red-700",
              toast.variant === "warning" && "border-yellow-500 bg-yellow-100 text-yellow-700",
              "flex justify-between items-center"
            )}
          >
            <div>
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && <p className="text-xs text-gray-600 mt-1">{toast.description}</p>}
            </div>
            {toast.duration !== Infinity && (
              <button
                type="button"
                className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => {
                  if (toast.dismiss) toast.dismiss()
                }}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        ))}
    </div>
  )
})

Toaster.displayName = "Toaster"

export { Toaster }