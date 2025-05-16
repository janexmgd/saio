import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageCarousel from './ImageCarousel.jsx';

const BASE_URL = 'https://saio-api.vercel.app';
// const BASE_URL = 'http://localhost:2999';

const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

// Fungsi untuk format ukuran file (Bytes → KB, MB, GB)
const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function MediaDownloader() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState(null);
  const [data, setData] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [isDownload, setIsDownload] = useState(false);
  const [mediaType, setMediaType] = useState('');

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

  const handleUrlChange = (e) => setUrl(e.target.value);
  const handleShowJson = () => setShowJson(!showJson);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setDownloadedBytes(0);
      setErrorMessage('');
      if (!url) return;
      setIsLoading(true);
      try {
        const { data } = await axios.post(
          `${BASE_URL}/service`,
          { url },
          {
            headers: {
              'x-user-agent': userAgent,
              Accept: '*',
            },
          }
        );
        if (data.data.service !== 'tiktok') {
          setErrorMessage('Unsupported service');
          return;
        }
        setMedia(data.data?.content?.video?.dynamicCover);
        setMediaType(data.data.type);
        setData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage(
          error.response?.data?.message ||
            error.response?.statusText ||
            'Network or server issue'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const handleDownload = async () => {
    if (!media || !data || data.data.type !== 'video') return;
    setIsDownload(true);
    setDownloadedBytes(0);
    setFileSize(0);

    try {
      const { playAddr } = data.data.content.video;
      const filename = `${data.data.content.author.uniqueId}_${data.data.content.id}.mp4`;

      const response = await axios({
        url: `${BASE_URL}/tunnel`,
        method: 'POST',
        data: { url: playAddr },
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'x-cookie': data.data.cookie,
          'x-user-agent': userAgent,
        },
        onDownloadProgress: (progressEvent) => {
          setDownloadedBytes(progressEvent.loaded);
          if (progressEvent.total) {
            setFileSize(progressEvent.total);
          }
        },
      });

      // Fallback: Ambil ukuran file dari header jika tidak tersedia di progressEvent
      if (!fileSize && response.headers['content-length']) {
        setFileSize(parseInt(response.headers['content-length']));
      }

      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.log(error);

      console.error('Download error:', error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.statusText ||
          'Download failed'
      );
    } finally {
      setIsDownload(false);
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
            placeholder='Paste URL here...'
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
            {mediaType === 'video' && (
              <div className='mb-4'>
                <div className='overflow-hidden mb-4 flex justify-center gap-0.5'>
                  <img
                    src={media}
                    alt='TikTok Preview'
                    className='max-h-[70vh] object-contain w-1/2'
                  />
                  <div className='text-pink-500 flex flex-col w-1/2 gap-2'>
                    <SyntaxHighlighter
                      style={darcula}
                      wrapLines={true}
                      wrapLongLines={true}
                      className='min-h-full'
                    >
                      {JSON.stringify(
                        {
                          author: data?.data?.content?.author?.uniqueId,
                          video: {
                            id: data?.data?.content?.video?.id,
                            createTime: data?.data?.content?.createTime,
                          },
                          description: data?.data?.content?.desc,
                          stats: data?.data?.content?.stats,
                        },
                        null,
                        2
                      )}
                    </SyntaxHighlighter>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className='w-full py-3 bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2 transition-colors'
                  disabled={isDownload}
                >
                  <Download size={20} />
                  {isDownload ? 'Downloading...' : 'Download'}
                </button>

                {(downloadedBytes > 0 || fileSize > 0) && (
                  <p className='text-center mt-2 text-pink-400'>
                    {`Downloaded: ${formatFileSize(
                      downloadedBytes
                    )} / ${formatFileSize(fileSize)}`}
                  </p>
                )}
              </div>
            )}

            {mediaType === 'image' && (
              <div className='flex justify-center items-start gap-7 mb-9'>
                <div className='w-1/2'>
                  <Slider {...settings} className='max-w-full'>
                    {data?.data?.content?.imagePost?.images?.map(
                      (item, index) => (
                        <ImageCarousel
                          key={index}
                          index={index}
                          url={item.imageURL.urlList[0]}
                          id={data.data.content.id}
                          username={data.data.content.author.uniqueId}
                          desc={data.data.content.desc}
                        />
                      )
                    )}
                  </Slider>
                </div>
                <div className='w-1/2 overflow-auto flex'>
                  <SyntaxHighlighter
                    style={darcula}
                    wrapLines={true}
                    wrapLongLines={true}
                    className='min-h-full'
                  >
                    {JSON.stringify(
                      {
                        author: data?.data?.content?.author?.uniqueId,
                        video: {
                          id: data?.data?.content?.video?.id,
                          createTime: data?.data?.content?.createTime,
                        },
                        description: data?.data?.content?.desc,
                        stats: data?.data?.content?.stats,
                      },
                      null,
                      2
                    )}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {data && (
              <div className='mt-3 text-pink-400'>
                <button onClick={handleShowJson} className='text-l'>
                  {showJson ? 'Hide JSON Response' : 'Show JSON Response'}
                </button>
                {showJson && (
                  <div className='text-pink-400 mt-4'>
                    <h2 className='text-xl font-bold mb-4'>JSON Response:</h2>
                    <SyntaxHighlighter language='json' style={darcula}>
                      {JSON.stringify(data, null, 2)}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            )}

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
