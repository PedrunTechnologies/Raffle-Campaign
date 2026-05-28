import { ToastProvider } from "@/components/ui/Toast";
import { VendorAuthProvider } from "@/context/VendorAuthContext";

export default function VendorRootLayout({ children }: { children: React.ReactNode }) {

  return (
    <ToastProvider>
      <VendorAuthProvider>
        {children}
      </VendorAuthProvider>
    </ToastProvider>
  );
}
