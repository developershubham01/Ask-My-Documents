import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

export function WelcomeVideo() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const handleVideoEnd = () => {
    navigate('/workspace');
  };

  const handleSkip = () => {
    navigate('/workspace');
  };

  useEffect(() => {
    // Attempt to auto-play
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn('Autoplay prevented. User interaction may be required.', error);
      });
    }
  }, []);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        src="/welcome.mp4"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onEnded={handleVideoEnd}
        autoPlay
        playsInline
        muted
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 32,
          right: 32,
          display: 'flex',
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={handleSkip}
          sx={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(15, 23, 42, 0.95)',
            },
          }}
        >
          Skip Intro
        </Button>
      </Box>
    </Box>
  );
}
