import { AuthProvider } from '@/lib/AuthContext';
import Sidebar from '@/components/Sidebar';
import ContentWrapper from '@/components/ContentWrapper';
import './globals.css';

export const metadata = {
  title: 'SIM PPDS - Sistem Informasi Pesantren',
  description: 'Sistem Informasi Manajemen Terpadu Pondok Pesantren',
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
          <div className="app-container">
            <Sidebar />
            <ContentWrapper>
              {children}
            </ContentWrapper>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
