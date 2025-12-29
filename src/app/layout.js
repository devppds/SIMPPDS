import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import ContentWrapper from '@/components/ContentWrapper';
import './globals.css';

export const runtime = 'edge';

export const metadata = {
  title: 'SIM-PPDS | SYSTEM INFORMASI SATU PINTU PONDOK PESANTREN DARUSSALAM LIRBOYO By. DevElz',
  description: 'Sistem Informasi Manajemen Terpadu Pondok Pesantren Darussalam Lirboyo',

};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ContentWrapper>
              {children}
            </ContentWrapper>
          </ToastProvider>
        </AuthProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
