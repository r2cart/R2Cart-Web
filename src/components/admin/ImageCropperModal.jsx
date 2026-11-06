import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  RefreshCw,
  Maximize2,
  Square,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import { Button, Modal } from '../ui';
import { mediaUrl } from '../../utils/media';

/**
 * Draws the transformed image onto a target canvas.
 * Handles centering, rotation, flip, user pan offset, and zoom scaling consistently.
 */
function renderCropToContext(ctx, targetSize, img, zoom, rotation, offset, flipH = false, flipV = false) {
  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // When rotated 90 or 270 degrees, effective width and height swap
  const isSideways = rotation % 180 !== 0;
  const effectiveW = isSideways ? img.naturalHeight : img.naturalWidth;
  const effectiveH = isSideways ? img.naturalWidth : img.naturalHeight;

  // Base scale covers the square viewport
  const baseScale = Math.max(targetSize / effectiveW, targetSize / effectiveH);
  const drawW = img.naturalWidth * baseScale * zoom;
  const drawH = img.naturalHeight * baseScale * zoom;

  // Scale user drag offset from 300px preview viewport coordinates to targetSize
  const scaleRatio = targetSize / 300;
  const ox = offset.x * scaleRatio;
  const oy = offset.y * scaleRatio;

  ctx.save();
  // Move origin to canvas center
  ctx.translate(targetSize / 2, targetSize / 2);

  // Apply user pan offset in screen coordinates
  ctx.translate(ox, oy);

  // Apply rotation around center
  ctx.rotate((rotation * Math.PI) / 180);

  // Apply flip horizontally and/or vertically
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Draw image centered at origin
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

export default function ImageCropperModal({
  open,
  imageSrc,
  initialZoom = 1,
  initialRotation = 0,
  initialOffset = { x: 0, y: 0 },
  initialFlipH = false,
  initialFlipV = false,
  onCropDone,
  onCancel
}) {
  const [zoom, setZoom] = useState(typeof initialZoom === 'number' && initialZoom > 0 ? initialZoom : 1);
  const [rotation, setRotation] = useState(initialRotation || 0);
  const [offset, setOffset] = useState(initialOffset || { x: 0, y: 0 });
  const [flipH, setFlipH] = useState(Boolean(initialFlipH));
  const [flipV, setFlipV] = useState(Boolean(initialFlipV));
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imageObjRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchDistRef = useRef(null);
  const touchCenterRef = useRef({ x: 150, y: 150 });

  // Redraw the live preview canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    // Canvas internal resolution is 600x600 for sharp retina display
    renderCropToContext(ctx, 600, img, zoom, rotation, offset, flipH, flipV);
  }, [zoom, rotation, offset, flipH, flipV]);

  // Load image object whenever imageSrc or initial props change
  useEffect(() => {
    if (!open || !imageSrc) return;

    const startingZoom = typeof initialZoom === 'number' && initialZoom > 0 ? initialZoom : 1;
    setZoom(startingZoom);
    setRotation(initialRotation || 0);
    setOffset(initialOffset || { x: 0, y: 0 });
    setFlipH(Boolean(initialFlipH));
    setFlipV(Boolean(initialFlipV));
    setImageLoaded(false);
    setLoadError(null);

    let active = true;
    let createdBlobUrl = null;

    const resolvedSrc = mediaUrl(imageSrc) || imageSrc;
    const isBlobOrData = resolvedSrc.startsWith('blob:') || resolvedSrc.startsWith('data:');

    const setupImage = (sourceUrl) => {
      const img = new Image();
      if (!sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (!active) return;
        imageObjRef.current = img;
        setImageLoaded(true);
        setLoadError(null);
      };

      img.onerror = () => {
        if (!active) return;
        // If anonymous CORS failed, try loading fallback without crossOrigin
        if (img.crossOrigin) {
          const fallback = new Image();
          fallback.onload = () => {
            if (!active) return;
            imageObjRef.current = fallback;
            setImageLoaded(true);
            setLoadError(null);
          };
          fallback.onerror = (fallbackErr) => {
            if (!active) return;
            console.error('All image load attempts failed for:', sourceUrl, fallbackErr);
            setLoadError('Failed to load image. Please verify file availability or re-upload.');
          };
          fallback.src = sourceUrl;
        } else {
          setLoadError('Failed to load image. Please verify file availability or re-upload.');
        }
      };

      img.src = sourceUrl;
    };

    // If it's a remote URL (http/https), try fetching as Blob first to bypass CORS canvas tainting
    if (!isBlobOrData && resolvedSrc.startsWith('http')) {
      fetch(resolvedSrc, { mode: 'cors' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          if (!active) return;
          createdBlobUrl = URL.createObjectURL(blob);
          setupImage(createdBlobUrl);
        })
        .catch(err => {
          if (!active) return;
          console.warn('Direct image fetch failed, falling back to <img> element load:', err);
          setupImage(resolvedSrc);
        });
    } else {
      setupImage(resolvedSrc);
    }

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [open, imageSrc, loadAttempt, initialZoom, initialRotation, initialOffset, initialFlipH, initialFlipV]);

  // Redraw canvas whenever transforms or image loading changes
  useEffect(() => {
    if (imageLoaded) {
      redraw();
    }
  }, [imageLoaded, redraw]);

  // Window-level mouse move and up listeners for flawless drag & pan
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const nextX = e.clientX - dragStartRef.current.x;
      const nextY = e.clientY - dragStartRef.current.y;
      setOffset({ x: nextX, y: nextY });
    };

    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  /**
   * Focal-point zoom: zooms in or out centered at point (pointX, pointY)
   * relative to the 300x300 viewport.
   */
  const zoomToPoint = useCallback((targetZoom, pointX = 150, pointY = 150) => {
    setZoom((currentZoom) => {
      const clampedZoom = Math.min(4.0, Math.max(0.3, Number(targetZoom.toFixed(2))));
      if (Math.abs(clampedZoom - currentZoom) < 0.001) return currentZoom;
      const ratio = clampedZoom / currentZoom;
      setOffset((currentOffset) => ({
        x: Math.round(pointX - 150 - (pointX - 150 - currentOffset.x) * ratio),
        y: Math.round(pointY - 150 - (pointY - 150 - currentOffset.y) * ratio)
      }));
      return clampedZoom;
    });
  }, []);

  const handleMouseDown = (e) => {
    // Left-click only
    if (e.button !== 0) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  // Double-click to zoom in directly at clicked point (or reset to 1x if already zoomed in)
  const handleDoubleClick = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (zoom < 1.8) {
      zoomToPoint(2.2, px, py);
    } else {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Touch Support with single-finger pan and two-finger pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = e.currentTarget.getBoundingClientRect();
      touchCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const nextX = e.touches[0].clientX - dragStartRef.current.x;
      const nextY = e.touches[0].clientY - dragStartRef.current.y;
      setOffset({ x: nextX, y: nextY });
    } else if (e.touches.length === 2 && touchDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = newDist / touchDistRef.current;
      touchDistRef.current = newDist;
      zoomToPoint(zoom * scale, touchCenterRef.current.x, touchCenterRef.current.y);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    touchDistRef.current = null;
  };

  // Mouse wheel zoom centered directly on cursor position
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Smooth proportional zoom: wheel up zooms in, wheel down zooms out
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    zoomToPoint(zoom * factor, px, py);
  };

  // Reset all adjustments
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setFlipH(false);
    setFlipV(false);
  };

  // Re-center pan offset without losing zoom or rotation
  const handleRecenter = () => {
    setOffset({ x: 0, y: 0 });
  };

  // Quick Action: Fit entire image inside square (Contain mode)
  const handleFitContain = () => {
    const img = imageObjRef.current;
    if (!img) return;
    const isSideways = rotation % 180 !== 0;
    const effW = isSideways ? img.naturalHeight : img.naturalWidth;
    const effH = isSideways ? img.naturalWidth : img.naturalHeight;
    const coverScale = Math.max(300 / effW, 300 / effH);
    const containScale = Math.min(300 / effW, 300 / effH);
    const fitZoom = Number((containScale / coverScale).toFixed(2));
    setZoom(fitZoom);
    setOffset({ x: 0, y: 0 });
  };

  // Quick Action: Fill square (Cover mode)
  const handleFillCover = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Final Export on 800x800 square canvas
  const handleApplyCrop = () => {
    const img = imageObjRef.current;
    if (!img) return;

    setIsProcessing(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 800;
      exportCanvas.height = 800;
      const exportCtx = exportCanvas.getContext('2d');

      // Draw with identical transform function to 800x800
      renderCropToContext(exportCtx, 800, img, zoom, rotation, offset, flipH, flipV);

      const finishCrop = (blob) => {
        setIsProcessing(false);
        if (!blob) {
          throw new Error('Failed to create image blob from crop.');
        }
        const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        onCropDone(file, previewUrl, { zoom, rotation, offset, flipH, flipV });
      };

      if (exportCanvas.toBlob) {
        exportCanvas.toBlob(
          (blob) => {
            if (blob) {
              finishCrop(blob);
            } else {
              // Fallback to dataURL
              try {
                const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                const fallbackBlob = new Blob([u8arr], { type: mime });
                finishCrop(fallbackBlob);
              } catch (fallbackErr) {
                setIsProcessing(false);
                console.error('Fallback export error:', fallbackErr);
                alert('Could not export cropped image. Please check CORS permissions or try choosing from your device.');
              }
            }
          },
          'image/jpeg',
          0.92
        );
      } else {
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const fallbackBlob = new Blob([u8arr], { type: mime });
        finishCrop(fallbackBlob);
      }
    } catch (err) {
      setIsProcessing(false);
      console.error('Canvas export error:', err);
      alert('Security note: Could not export crop because the image source has restricted CORS permissions. Please download the image to your computer and choose it from your device.');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} title="Product Image Studio (1:1 Square)">
      <div style={{ padding: '14px 18px 18px', boxSizing: 'border-box', width: '100%', maxWidth: '420px', margin: '0 auto' }}>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px', textAlign: 'center', lineHeight: 1.4 }}>
          Drag to reposition. Scroll wheel or double-click on any part of the image to zoom directly into that point.
        </p>

        {/* Viewport Frame (300px x 300px) */}
        <div
          title="Drag to move · Double-click to zoom at cursor · Scroll wheel to zoom in/out"
          style={{
            width: '300px',
            height: '300px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            background: '#0f172a',
            border: '2px solid #059669',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.16)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Live Retina Canvas (Internal 600x600, Display 300x300) */}
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
              width: '300px',
              height: '300px',
              display: 'block',
              pointerEvents: 'none'
            }}
          />

          {!imageLoaded && !loadError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                background: '#0f172a'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Loading image…</span>
              </div>
            </div>
          )}

          {loadError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: '12px',
                background: '#0f172a',
                zIndex: 5
              }}
            >
              <AlertCircle size={28} color="#ef4444" />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#fca5a5' }}>Failed to load image</p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px' }}>{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setLoadAttempt(a => a + 1)}
                style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Rule of Thirds Grid Overlay (Toggleable) */}
          {showGrid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 3,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                opacity: 0.85
              }}
            >
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)', borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)', borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)', borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)', borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.28)' }} />
              <div />
            </div>
          )}

          {/* Corner Viewfinder Accents */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderTop: '3px solid #10b981', borderRight: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
        </div>

        {/* Micro-hint */}
        <div style={{ textAlign: 'center', marginTop: '6px', marginBottom: '10px' }}>
          <small style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
            ✨ Double-click on any point to zoom there · Scroll wheel to zoom · Drag to pan
          </small>
        </div>

        {/* Controls Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '10px 12px',
            maxWidth: '360px',
            margin: '0 auto'
          }}
        >
          {/* Zoom Slider Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => zoomToPoint(zoom - 0.1, 150, 150)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>

            <input
              type="range"
              min="0.3"
              max="4.0"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#059669', cursor: 'pointer', height: '6px' }}
            />

            <button
              type="button"
              onClick={() => zoomToPoint(zoom + 0.1, 150, 150)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0f172a',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '2px 6px',
                minWidth: '40px',
                textAlign: 'center'
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Zoom Preset Pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginRight: '2px', textTransform: 'uppercase' }}>
              Zoom:
            </span>
            {[
              { label: 'Fit', action: handleFitContain },
              { label: 'Fill', action: handleFillCover },
              { label: '90%', action: () => zoomToPoint(0.9, 150, 150), active: Math.round(zoom * 100) === 90 },
              { label: '100%', action: () => zoomToPoint(1.0, 150, 150), active: Math.round(zoom * 100) === 100 },
              { label: '125%', action: () => zoomToPoint(1.25, 150, 150), active: Math.round(zoom * 100) === 125 },
              { label: '150%', action: () => zoomToPoint(1.5, 150, 150), active: Math.round(zoom * 100) === 150 },
              { label: '200%', action: () => zoomToPoint(2.0, 150, 150), active: Math.round(zoom * 100) === 200 }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={p.action}
                style={{
                  padding: '3px 7px',
                  borderRadius: '6px',
                  border: `1px solid ${p.active ? '#059669' : '#e2e8f0'}`,
                  background: p.active ? '#ecfdf5' : '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: p.active ? '#059669' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Rotate, Flip & Utility Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Rotate 90 degrees counter-clockwise"
            >
              <RotateCcw size={12} />
              <span>-90°</span>
            </button>

            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw size={12} />
              <span>+90°</span>
            </button>

            <button
              type="button"
              onClick={() => setFlipH((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: `1px solid ${flipH ? '#059669' : '#e2e8f0'}`,
                background: flipH ? '#ecfdf5' : '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: flipH ? '#059669' : '#334155',
                cursor: 'pointer'
              }}
              title="Flip horizontally (mirror)"
            >
              <FlipHorizontal size={12} />
              <span>Flip H</span>
            </button>

            <button
              type="button"
              onClick={() => setFlipV((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: `1px solid ${flipV ? '#059669' : '#e2e8f0'}`,
                background: flipV ? '#ecfdf5' : '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: flipV ? '#059669' : '#334155',
                cursor: 'pointer'
              }}
              title="Flip vertically"
            >
              <FlipVertical size={12} />
              <span>Flip V</span>
            </button>

            <button
              type="button"
              onClick={handleRecenter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Re-center image pan"
            >
              <Crosshair size={12} />
              <span>Center</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: `1px solid ${showGrid ? '#059669' : '#e2e8f0'}`,
                background: showGrid ? '#ecfdf5' : '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: showGrid ? '#059669' : '#64748b',
                cursor: 'pointer'
              }}
              title="Toggle rule-of-thirds grid overlay"
            >
              <Grid size={12} />
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                color: '#dc2626',
                cursor: 'pointer'
              }}
              title="Reset Zoom, Pan, Rotation and Flip"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            style={{
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              padding: '7px 15px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#475569',
              background: '#ffffff'
            }}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!imageLoaded || isProcessing}
            onClick={handleApplyCrop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              background: '#059669',
              color: '#ffffff',
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Check size={16} strokeWidth={2.5} />
            <span>{isProcessing ? 'Cropping…' : 'Apply Crop (1:1)'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
