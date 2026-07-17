import "./globals.css";
import { AuthProvider } from '@/app/contexts/AuthContext';
import { PublicAuthProvider } from '@/app/contexts/PublicAuthContext';
import { ToastProvider } from '@/app/components/GlassToastContainer';

export const metadata = {
  title: 'DearHR — Resume Maker Platform',
  description: 'AI-powered ATS resume builder and job application platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <AuthProvider>
          <PublicAuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </PublicAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}