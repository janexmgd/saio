import { useState } from 'react';
import axios from 'axios';

const ImageCarousel = ({ index, url, id, username, desc }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!url || loading) return;

    try {
      setLoading(true);
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });

      if (!blob.type.startsWith('image/')) {
        console.error('Invalid image type:', blob.type);
        setError('Invalid image type');
        return;
      }

      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = `${username}_${id}_${index}.png`;
      a.click();
      window.URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error('Error during download:', error);
      setError('Failed to download image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-4xl mx-auto'>
      <img
        src={url}
        alt={`Image by ${username}`}
        className='w-full h-auto object-contain'
      />
      <div className='text-center mt-4'>
        <h3 className='text-xl text-white font-semibold'>{username}</h3>
        <p className='text-gray-400 mt-2'>{desc}</p>
      </div>
      <div className='flex flex-col items-center gap-2 mt-4'>
        <button
          onClick={handleDownload}
          disabled={loading}
          className={`px-6 py-2 bg-pink-500 text-white font-semibold transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
          }`}
        >
          {loading ? 'Downloading...' : 'Download'}
        </button>
        {error && (
          <div className='bg-red-100 text-red-600 px-4 py-2 rounded-md'>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;
