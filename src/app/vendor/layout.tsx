"use client";
import { ToastProvider } from "@/components/ui/Toast";
import { useVendorAuth, VendorAuthProvider } from "@/context/VendorAuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";



function FcmRegistrar() {
  const { user } = useVendorAuth();
  useFcmToken({ user, tokenEndpoint: "/api/vendor/fcm-token" });
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
