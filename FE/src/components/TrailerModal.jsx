import React from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const TrailerModal = ({ visible, trailerUrl, onClose }) => {
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const videoId = getYouTubeVideoId(trailerUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: '1200px', top: '5%' }}
      closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: '24px' }} />}
      styles={{
        content: {
          background: '#0a0a0a',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden'
        },
        header: {
          background: '#0a0a0a',
          border: 'none',
          padding: '16px 24px'
        },
        body: {
          padding: 0
        }
      }}
      destroyOnHidden
    >
      {embedUrl ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={embedUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Movie Trailer"
          />
        </div>
      ) : (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          color: '#fff',
          background: '#1a1a1a'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>Không thể tải trailer</p>
          <p style={{ color: '#999', fontSize: '14px' }}>
            URL trailer không hợp lệ hoặc không khả dụng.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default TrailerModal;

