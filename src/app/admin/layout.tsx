import { ToastProvider } from "@/components/ui/Toast";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // return <AdminAuthProvider>{children}</AdminAuthProvider>;
  return (
    <ToastProvider>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </ToastProvider>
  );
}