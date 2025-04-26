import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

export default function MediaDownloader() {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState(null);
  const [media, setMedia] = useState(null);
  const [data, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showJson, setShowJson] = useState(false);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!url) return;
      setUrl(url.trim());
      setIsLoading(true);
      try {
        const { data } = await axios('https://saio-api.vercel.app/service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({
            url: url,
          }),
        });
        const videoData = data.data?.content?.video?.bitrateInfo;

        if (videoData?.length) {
          setMedia(data.data.content.video.dynamicCover);
        }

        setMediaType(data.data.type);
        setResponse(data);
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Error fetching data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const handleDownload = async () => {
    if (!media) return;

    let downloadUrl;
    const cookie = data.data.cookie;
    const { playAddr } = data.data.content.video;
    downloadUrl = playAddr;
    if (!downloadUrl) {
      throw new Error('URL tidak valid atau tidak ditemukan.');
    }

    const filename = `${data.data.content.author.uniqueId}_${data.data.content.id}.mp4`;

    try {
      const response = await axios({
        url: 'https://saio-api.vercel.app/tunnel',
        method: 'POST',
        data: {
          url: downloadUrl,
          cookie,
        },
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress(percentCompleted);
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
      alert('Error downloading media: ' + error.message);
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
                  {mediaType === 'image' && (
                    <img
                      src={media}
                      alt='TikTok Preview'
                      className='max-h-[70vh] object-contain'
                      onError={() => setMediaType(null)}
                    />
                  )}
                  {mediaType === 'video' && (
                    <img
                      src={media}
                      alt='TikTok Preview'
                      className='max-h-[50vh] object-contain'
                      onError={() => setMediaType(null)}
                    />
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  className='w-full py-3 bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2 transition-colors'
                >
                  <Download size={20} />
                  Download Media
                </button>

                {downloadProgress > 0 && (
                  <div className='w-full bg-gray-200 h-4 rounded-lg mt-4'>
                    <div
                      className='bg-pink-500 h-full rounded-lg transition-all'
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {data && (
              <div className='p-4'>
                <button
                  onClick={() => setShowJson(!showJson)}
                  className='mb-2 text-pink-500 hover:underline'
                >
                  {showJson ? (
                    <span className='text-red-300'>Hide data</span>
                  ) : (
                    <span className='text-green-300 text-xl'>Show data</span>
                  )}
                </button>
                {showJson && data && (
                  <div className='mt-6'>
                    <h2 className='text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100'>
                      API data
                    </h2>
                    <div className='relative'>
                      <div className='overflow-hidden border border-gray-200 dark:border-gray-700'>
                        <SyntaxHighlighter
                          language='json'
                          style={atomDark}
                          wrapLines={true}
                          wrapLongLines={true}
                          customStyle={{
                            margin: 0,
                            padding: '1.25rem',
                            fontSize: '0.9rem',
                            backgroundColor: '#1e1e1e',
                            overflowX: 'auto',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                          lineProps={{
                            style: {
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            },
                          }}
                        >
                          {JSON.stringify(data, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
