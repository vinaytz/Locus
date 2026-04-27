'use client';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'group toast bg-card text-card-foreground border border-border shadow-lg',
        },
      }}
    />
  );
}
