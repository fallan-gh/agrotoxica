import './globals.css';
import Hotbar from '../components/Hotbar';

export const metadata = {
  title: 'Associação Atlética Agrotóxica',
  description: 'A maior e melhor atlética de Agronomia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-poppins antialiased">
        {children}
        <Hotbar />
      </body>
    </html>
  );
}