import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      duration={3000}
      closeButton
      expand
      visibleToasts={3}
      gap={12}
      className="z-[9999]"
    />
  );
}
