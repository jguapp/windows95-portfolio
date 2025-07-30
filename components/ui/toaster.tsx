"use client"

import { useToast } from "@/hooks/use-toast"
<<<<<<< HEAD
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
=======
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
>>>>>>> 95980238faa674fded7712a92e4e51fae16851ce

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
<<<<<<< HEAD
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
=======
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
>>>>>>> 95980238faa674fded7712a92e4e51fae16851ce
      <ToastViewport />
    </ToastProvider>
  )
}
