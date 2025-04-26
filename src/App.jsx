import './index.css';
import MediaDownloader from './components/MediaDownloader.jsx';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Switch from 'react-switch';

export default function App() {
  // Cek preferensi tema user dari browser/localStorage
  const [darkMode, setDarkMode] = useState(() => {
    // Jika di localStorage ada preferensi, gunakan itu
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // Efek untuk mengubah tema dan menyimpan preferensi
  useEffect(() => {
    // 1. Tambah/hapus class 'dark' di root HTML
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Simpan preferensi tema ke localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fungsi toggle theme
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <main className='container-fluid mx-auto p-4 min-h-screen flex flex-col justify-center items-center bg-white dark:bg-gray-900 transition-colors duration-300'>
      <div className='w-full flex'>
        <div className='w-full flex items-center justify-end'>
          <Switch
            onChange={toggleDarkMode}
            checked={darkMode}
            onColor='#86d3ff'
            offColor='#000000'
            uncheckedIcon={
              <div className='flex items-center justify-center h-full'>
                <Moon size={16} color='white' />
              </div>
            }
            checkedIcon={
              <div className='flex items-center justify-center h-full'>
                <Sun size={16} color='yellow' />
              </div>
            }
            height={25}
            width={50}
            handleDiameter={20}
            aria-label='Toggle dark mode'
          />
        </div>
      </div>

      <h1 className='text-3xl font-bold mb-6 text-center text-gray-900  dark:text-pink-400 transition-colors duration-300'>
        Media Downloader
      </h1>

      <MediaDownloader />

      <footer className='mt-auto py-4 text-center text-gray-500 dark:text-pink-400'>
        Created with ❤️ by Janexmgd
      </footer>
    </main>
  );
}
