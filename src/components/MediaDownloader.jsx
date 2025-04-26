import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export default function MediaDownloader() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedBytes, setDownloadedBytes] = useState(0); // Menyimpan jumlah byte yang diunduh
  const [errorMessage, setErrorMessage] = useState(''); // Menyimpan pesan error

  const handleUrlChange = (e) => setUrl(e.target.value);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setDownloadedBytes(0);
      setErrorMessage(''); // Reset error message
      if (!url) return;

      setIsLoading(true);
      try {
        const { data } = await axios.post(
          'https://saio-api.vercel.app/service',
          { url },
          { headers: { 'Content-Type': 'application/json' } }
        );

        setMedia(data.data?.content?.video?.dynamicCover);
        setData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response) {
          // Jika ada response dari server, tampilkan errornya
          setErrorMessage(
            error.response.data.message || error.response.statusText
          );
        } else {
          // Jika tidak ada response dari server, tampilkan pesan umum
          setErrorMessage('Network or server issue');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const handleDownload = async () => {
    if (!media || !data) return;

    const { playAddr } = data.data.content.video;
    const filename = `${data.data.content.author.uniqueId}_${data.data.content.id}.mp4`;

    try {
      const response = await axios({
        url: 'https://saio-api.vercel.app/tunnel',
        method: 'POST',
        data: { url: playAddr, cookie: data.data.cookie },
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' },
        onDownloadProgress: (progressEvent) => {
          setDownloadedBytes(progressEvent.loaded);
        },
      });

      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      if (error.response) {
        // Jika ada response dari server, tampilkan errornya
        setErrorMessage(
          error.response.data.message || error.response.statusText
        );
      } else {
        // Jika tidak ada response dari server, tampilkan pesan umum
        setErrorMessage('Network or server issue');
      }
    }
  };

  return (
    <div className='w-full mx-auto px-4 py-8 max-w-6xl'>
      <div className='bg-white dark:bg-gray-900 p-6 mb-8'>
        <form
          onSubmit={handleSubmit}
          className='flex flex-col sm:flex-row gap-2 mb-8'
        >
          <input
            type='url'
            placeholder='Paste url here...'
            value={url}
            onChange={handleUrlChange}
            className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-pink-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent'
            required
          />
          <button
            type='submit'
            disabled={isLoading}
            className={`px-6 py-3 font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            } transition-colors`}
          >
            {isLoading ? 'Processing...' : 'Fetch Media'}
          </button>
        </form>

        {isLoading ? (
          <div className='text-center text-pink-500'>Loading...</div>
        ) : (
          <>
            {media && (
              <div className='mb-8'>
                <div className='overflow-hidden mb-4 flex justify-center'>
                  <img
                    src={media}
                    alt='TikTok Preview'
                    className='max-h-[70vh] object-contain'
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className='w-full py-3 bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2 transition-colors'
                >
                  <Download size={20} />
                  Download Media
                </button>

                {downloadedBytes > 0 && (
                  <div className='w-full bg-gray-200 h-4 rounded-lg mt-4'>
                    <div
                      className='bg-pink-500 h-full rounded-lg transition-all'
                      style={{
                        width: `${(downloadedBytes / 1000000).toFixed(2)}MB`,
                      }}
                    ></div>
                    <p className='text-center mt-2'>{`Downloaded: ${downloadedBytes} bytes`}</p>
                  </div>
                )}
              </div>
            )}

            {/* Menampilkan JSON data */}
            {data && (
              <div className='mt-8'>
                <h2 className='text-xl font-bold mb-4'>JSON Data:</h2>
                <SyntaxHighlighter language='json'>
                  {JSON.stringify(data, null, 2)}
                </SyntaxHighlighter>
              </div>
            )}

            {/* Menampilkan error message jika ada */}
            {errorMessage && (
              <div className='mt-8 text-red-500 bg-red-100 p-4 rounded-lg'>
                <strong>Error:</strong> {errorMessage}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
