import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import Sidebar from '@/components/Sidebar';
import ContentWrapper from '@/components/ContentWrapper';
import './globals.css';

export const runtime = 'edge';

export const metadata = {
  title: 'SIM-PPDS | SYSTEM INFORMASI SATU PINTU PONDOK PESANTREN DARUSSALAM LIRBOYO By. DevElz',
  description: 'Sistem Informasi Manajemen Terpadu Pondok Pesantren Darussalam Lirboyo',
  icons: {
    icon: 'https://res.cloudinary.com/dceamfy3n/image/upload/v1766596001/logo_zdenyr.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="app-container">
              <Sidebar />
              <ContentWrapper>
                {children}
              </ContentWrapper>
            </div>
          </ToastProvider>
        </AuthProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
