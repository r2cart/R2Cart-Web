import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X, RefreshCw, Maximize2, Square } from 'lucide-react';
import { Button, Modal } from '../ui';

/**
 * Draws the transformed image onto a target canvas.
 * Handles centering, rotation, user pan offset, and zoom scaling consistently.
 */
function renderCropToContext(ctx, targetSize, img, zoom, rotation, offset) {
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
  // Move origin to center
  ctx.translate(targetSize / 2, targetSize / 2);

  // Apply user pan offset in screen coordinates
  ctx.translate(ox, oy);

  // Apply rotation around center
  ctx.rotate((rotation * Math.PI) / 180);

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
  onCropDone,
  onCancel
}) {
  const [zoom, setZoom] = useState(initialZoom || 1);
  const [rotation, setRotation] = useState(initialRotation || 0);
  const [offset, setOffset] = useState(initialOffset || { x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imageObjRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Redraw the live preview canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    // Canvas internal resolution is 600x600 for sharp retina display
    renderCropToContext(ctx, 600, img, zoom, rotation, offset);
  }, [zoom, rotation, offset]);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!open || !imageSrc) return;

    setZoom(initialZoom || 1);
    setRotation(initialRotation || 0);
    setOffset(initialOffset || { x: 0, y: 0 });
    setImageLoaded(false);

    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      if (!active) return;
      imageObjRef.current = img;
      setImageLoaded(true);
    };

    img.onerror = () => {
      // If anonymous CORS failed on external url, try loading without crossOrigin
      if (img.crossOrigin) {
        const fallback = new Image();
        fallback.src = imageSrc;
        fallback.onload = () => {
          if (!active) return;
          imageObjRef.current = fallback;
          setImageLoaded(true);
        };
      }
    };

    return () => {
      active = false;
    };
  }, [open, imageSrc]);

  // Redraw canvas whenever zoom, rotation, offset or image loading changes
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
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  // Touch Support for mobile / tablets
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const nextX = e.touches[0].clientX - dragStartRef.current.x;
    const nextY = e.touches[0].clientY - dragStartRef.current.y;
    setOffset({ x: nextX, y: nextY });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(3, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  // Quick Action: Reset to default center & scale 1
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
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
      renderCropToContext(exportCtx, 800, img, zoom, rotation, offset);

      exportCanvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (!blob) return;
          const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onCropDone(file, previewUrl, { zoom, rotation, offset });
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      setIsProcessing(false);
      console.error('Canvas export error:', err);
      // Fallback: If canvas tainted due to external URL without CORS, alert user
      alert('Security note: Could not export crop because the pasted image URL has restricted CORS permissions. Please download the image to your computer and choose it from your device.');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} title="Product Image Studio (1:1 Square)">
      <div style={{ padding: '16px 20px 22px', boxSizing: 'border-box', width: '100%' }}>
        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.4 }}>
          Drag the photo to center it inside the square frame. Use the zoom slider or preset buttons to fit your product cleanly.
        </p>

        {/* Viewport Frame (300px x 300px) */}
        <div
          style={{
            width: '300px',
            height: '300px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            background: '#0f172a',
            border: '2px solid #059669',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
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

          {!imageLoaded && (
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
              Loading image…
            </div>
          )}

          {/* Rule of Thirds Grid Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 3,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr'
            }}
          >
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)', borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)', borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)', borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)', borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.25)' }} />
            <div />
          </div>

          {/* Corner Viewfinder Accents */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderTop: '3px solid #10b981', borderRight: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981', pointerEvents: 'none', zIndex: 4 }} />
        </div>

        {/* Micro-hint */}
        <div style={{ textAlign: 'center', marginTop: '6px', marginBottom: '12px' }}>
          <small style={{ fontSize: '11px', color: '#94a3b8' }}>
            💡 Drag to move · Scroll wheel to zoom
          </small>
        </div>

        {/* Controls Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            maxWidth: '340px',
            margin: '0 auto'
          }}
        >
          {/* Zoom Slider Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
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
              min="0.4"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#059669', cursor: 'pointer', height: '6px' }}
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
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
                minWidth: '38px',
                textAlign: 'center'
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Preset Buttons & Rotation Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Rotate 90 degrees counter-clockwise"
            >
              <RotateCcw size={12} />
              <span>Left</span>
            </button>

            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw size={12} />
              <span>Right</span>
            </button>

            <button
              type="button"
              onClick={handleFillCover}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Fill square completely"
            >
              <Square size={12} />
              <span>Fill</span>
            </button>

            <button
              type="button"
              onClick={handleFitContain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Fit entire image within square"
            >
              <Maximize2 size={12} />
              <span>Fit</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                cursor: 'pointer'
              }}
              title="Reset Zoom, Pan and Rotation"
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
            marginTop: '18px',
            paddingTop: '14px',
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
              padding: '8px 16px',
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
              padding: '8px 18px',
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
