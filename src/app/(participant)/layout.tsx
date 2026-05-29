"use client";

import { AuthProvider } from "@/context/AuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";

function FcmRegistrar() {
  useFcmToken({ tokenEndpoint: "/api/participant/fcm-token" });
  return null;
}

export default function ParticipantRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FcmRegistrar />
      {children}
    </AuthProvider>
  );
}
