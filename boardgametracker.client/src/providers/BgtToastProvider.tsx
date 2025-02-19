import { v4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { createContext, ElementRef, forwardRef, ReactNode, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from 'class-variance-authority';
import * as RadixToast from '@radix-ui/react-toast';

import XIcon from '@/assets/icons/x.svg?react';
import WarningTriangleIcon from '@/assets/icons/warning-triangle.svg?react';
import InfoCircleIcon from '@/assets/icons/info-circle.svg?react';

const ToastContext = createContext<{
  showInfoToast: (text: string) => void;
  showWarningToast: (text: string) => void;
  showErrorToast: (text: string) => void;
}>({
  showInfoToast: () => {
    throw new Error("You can't call showInfoToast() outside of a <ToastProvider> – add it to your tree.");
  },
  showErrorToast: () => {
    throw new Error("You can't call showErrorToast() outside of a <ToastProvider> – add it to your tree.");
  },
  showWarningToast: () => {
    throw new Error("You can't call showWarningToast() outside of a <ToastProvider> – add it to your tree.");
  },
});

export function useToast() {
  return useContext(ToastContext);
}

export enum ToastType {
  Info = 0,
  Error = 1,
  Warning = 2,
}

interface Props {
  children: ReactNode;
}

interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

export const BgtToastProvider = (props: Props) => {
  const { children } = props;

  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: ToastType) => {
    setMessages((toasts) => [
      ...toasts,
      {
        id: v4(),
        text,
        type,
      },
    ]);
  };

  const showInfoToast = (text: string) => {
    showToast(text, ToastType.Info);
  };

  const showErrorToast = (text: string) => {
    showToast(text, ToastType.Error);
  };

  const showWarningToast = (text: string) => {
    showToast(text, ToastType.Warning);
  };

  return (
    <RadixToast.Provider>
      <ToastContext.Provider value={{ showInfoToast, showErrorToast, showWarningToast }}>
        {children}
      </ToastContext.Provider>

      <AnimatePresence mode="popLayout">
        {messages.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => setMessages((toasts) => toasts.filter((t) => t.id !== toast.id))}
          />
        ))}
      </AnimatePresence>

      <RadixToast.Viewport className="fixed right-4 bottom-4 flex w-80 flex-col-reverse gap-3" />
    </RadixToast.Provider>
  );
};

const Toast = forwardRef<
  ElementRef<typeof RadixToast.Root>,
  {
    onClose: () => void;
    toast: ToastMessage;
  }
>(function Toast({ onClose, toast }, forwardedRef) {
  const width = 320;
  const margin = 16;
  const { t } = useTranslation();

  return (
    <RadixToast.Root ref={forwardedRef} asChild forceMount onOpenChange={onClose} duration={2000} className="z-[9999]">
      <motion.li
        layout
        initial={{ x: width + margin }}
        animate={{ x: 0 }}
        exit={{
          opacity: 0,
          zIndex: -1,
          transition: {
            opacity: {
              duration: 0.2,
            },
          },
        }}
        transition={{
          type: 'spring',
          mass: 1,
          damping: 30,
          stiffness: 200,
        }}
        style={{ width, WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className={cx(
            'flex items-center w-full max-w-xs p-3 mt-2 text-white rounded-lg shadow',
            toast.type === ToastType.Info && 'bg-green-950',
            toast.type === ToastType.Warning && 'bg-orange-950',
            toast.type === ToastType.Error && 'bg-red-950'
          )}
        >
          <div
            className={cx(
              'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg text-white',
              toast.type === ToastType.Info && 'bg-green-600 ',
              toast.type === ToastType.Warning && 'bg-orange-600 ',
              toast.type === ToastType.Error && 'bg-red-600'
            )}
          >
            {toast.type === ToastType.Info && <InfoCircleIcon className="size-5" />}
            {toast.type === ToastType.Warning && <WarningTriangleIcon className="size-5" />}
            {toast.type === ToastType.Error && <WarningTriangleIcon className="size-5" />}
          </div>
          <div className="ms-3 text-sm font-normal">{t(toast.text)}</div>
          <button
            type="button"
            onClick={onClose}
            className="ms-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-white rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 "
          >
            <XIcon className="size-5" />
          </button>
        </div>
      </motion.li>
    </RadixToast.Root>
  );
});
