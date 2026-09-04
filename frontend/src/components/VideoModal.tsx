import { useEffect, useRef, useState } from 'react';
import { Film, Maximize2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import type { Listing } from '../types';
import { decodeText } from '../utils/decodeText';
import { useLanguage } from '../i18n/language';

export default function VideoModal({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const { text } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoSrc = listing.video || '/videos/morocco-hero.mp4';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === ' ') {
        event.preventDefault();
        togglePlay();
      } else if (event.key.toLowerCase() === 'm') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void videoRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      className="modal-backdrop video-player-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={text.videoTour}
      onMouseDown={onClose}
    >
      <div
        className="video-player-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="video-player-header">
          <div className="video-player-title">
            <span className="video-tag">
              <Film size={14} />
              {text.videoTour}
            </span>
            <h3>{decodeText(listing.title)}</h3>
          </div>
          <button
            type="button"
            className="modal-close video-close-btn"
            onClick={onClose}
            aria-label={text.close}
          >
            <X size={20} />
          </button>
        </div>

        <div className="video-player-media-wrap">
          <video
            ref={videoRef}
            src={videoSrc}
            className="video-element"
            autoPlay
            muted
            playsInline
            controls
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={() => {
              if (videoRef.current) {
                setIsMuted(videoRef.current.muted);
              }
            }}
          />

          <div className="video-custom-controls">
            <button
              type="button"
              className="video-control-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              className="video-control-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              type="button"
              className="video-control-btn video-fullscreen-btn"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

