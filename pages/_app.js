import localFont from 'next/font/local';
import '../styles/globals.css';

const neueKabel = localFont({
  src: [
    { path: '../public/fonts/NeueKabel-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/NeueKabel-Bold.otf',    weight: '700', style: 'normal' },
  ],
  display: 'block',
  variable: '--font-neue-kabel',
});

export default function App({ Component, pageProps }) {
  return (
    <main className={neueKabel.className}>
      <Component {...pageProps} />
    </main>
  );
}
