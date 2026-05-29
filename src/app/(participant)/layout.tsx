"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";

function FcmRegistrar() {
  // const { user } = useAuth();
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
