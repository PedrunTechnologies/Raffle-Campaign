"use client";
import { ToastProvider } from "@/components/ui/Toast";
import { VendorAuthProvider } from "@/context/VendorAuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";

function FcmRegistrar() {
  useFcmToken({ tokenEndpoint: "/api/vendor/fcm-token" });
  return null;
}



export default function VendorRootLayout({ children }: { children: React.ReactNode }) {

  return (
    <ToastProvider>
      <VendorAuthProvider>
        <FcmRegistrar />
        {children}
      </VendorAuthProvider>
    </ToastProvider>
  );
}
