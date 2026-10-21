import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  X,
  User,
  Phone,
  ShieldCheck,
  MapPin,
  KeyRound,
  FileText,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../../components/ui';
import { deliveryService } from '../../services/delivery.service';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export function DeliveryProofModal({ open, onClose, order, onSuccess }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [recipientName, setRecipientName] = useState(order?.customerName || '');
  const [recipientPhone, setRecipientPhone] = useState(order?.customerPhone || '');
  const [customerOtp, setCustomerOtp] = useState('');
  const [collectedAmount, setCollectedAmount] = useState(
    order?.paymentMethod === 'COD' ? String(order?.codAmountToCollect || order?.grandTotal || 0) : '0'
  );
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Live Camera state & refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  const startCamera = async (facing = cameraFacing) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      setCameraLoading(true);
      setError('');
      setIsCameraActive(true);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }
      setCameraLoading(false);
    } catch (err) {
      console.warn('Live camera start failed, fallback to native file capture:', err);
      stopCamera();
      cameraInputRef.current?.click();
      setError('Live camera could not be opened directly. Falling back to device camera/file picker.');
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture photo frame. Please try again.');
        return;
      }
      const file = new File([blob], `proof-${order?.orderNumber || 'delivery'}-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      setPhotoFile(file);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.88));
      stopCamera();
    }, 'image/jpeg', 0.88);
  };

  const handleToggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Sync state whenever order prop changes
  useEffect(() => {
    if (order) {
      setRecipientName(order.customerName || '');
      setRecipientPhone(order.customerPhone || '');
      setCollectedAmount(
        order.paymentMethod === 'COD' ? String(order.codAmountToCollect || order.grandTotal || 0) : '0'
      );
      setCustomerOtp('');
      setNotes('');
      setError('');
      setPhotoFile(null);
      setPhotoPreview(null);
      stopCamera();
    }
  }, [order]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPG, PNG, WebP) are accepted');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }

    setError('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    stopCamera();
    setPhotoFile(null);
    setPhotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleModalClose = () => {
    if (!uploading) {
      stopCamera();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setError('A photo proof of delivery is mandatory before completing delivery');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const assignmentId = order.assignmentId;

      // 1. Upload proof photo directly to Cloudinary via backend
      const formData = new FormData();
      formData.append('proofImage', photoFile);
      formData.append('recipientName', recipientName.trim());
      formData.append('recipientPhone', recipientPhone.trim());
      if (customerOtp) formData.append('customerOtp', customerOtp.trim());
      if (notes) formData.append('notes', notes.trim());

      await deliveryService.uploadProof(assignmentId, formData);

      // 2. Mark order as DELIVERED with COD collection details
      await deliveryService.completeDelivery(assignmentId, {
        collectedAmount: order.paymentMethod === 'COD' ? Number(collectedAmount) : 0,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        customerOtp: customerOtp.trim() || undefined,
        notes: notes.trim() || undefined
      });

      handleResetPhoto();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit delivery proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isCod = order?.paymentMethod === 'COD';
  const expectedAmount = Number(order?.codAmountToCollect || order?.grandTotal || 0);
  const collectedNum = Number(collectedAmount) || 0;

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      size="pod-modal"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              color: '#059669',
              border: '1px solid #a7f3d0',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Delivery Verification
              </div>
              <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a' }}>
                Proof of Delivery
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '11.5px',
            fontFamily: 'monospace',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '7px',
            background: '#0f172a',
            color: '#38bdf8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            #{order?.orderNumber}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '10px',
              padding: '11px 14px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Order & Customer Snapshot Strip */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}>
                <User size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order?.customerName || 'Customer'}
                  </b>
                  {order?.customerPhone && (
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      ({order.customerPhone})
                    </span>
                  )}
                </div>
                {order?.deliveryAddress && (
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px'
                  }}>
                    <MapPin size={11} style={{ flexShrink: 0, color: '#94a3b8' }} />
                    <span>{order.deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 700,
              background: isCod ? '#fef3c7' : '#dcfce7',
              color: isCod ? '#92400e' : '#15803d',
              border: `1px solid ${isCod ? '#fde68a' : '#bbf7d0'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>{isCod ? '💵 COD' : '✓ Prepaid'}</span>
              <span>•</span>
              <span>{isCod ? `Collect ${money(expectedAmount)}` : 'Paid Online'}</span>
            </div>
          </div>

          {/* 2. Photo Proof Capture Card */}
          <div style={{
            border: photoPreview ? '2px solid #059669' : isCameraActive ? '2px solid #10b981' : '2px dashed #86efac',
            borderRadius: '16px',
            padding: photoPreview ? '10px' : isCameraActive ? '8px' : '16px 14px',
            textAlign: 'center',
            background: photoPreview || isCameraActive ? '#09090b' : 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={photoPreview}
                    alt="Delivery proof preview"
                    style={{
                      maxHeight: '210px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '10px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleResetPhoto}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '20px',
                      padding: '5px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      transition: 'all 0.15s ease'
                    }}
                    title="Retake photo"
                  >
                    <RefreshCw size={12} /> Retake
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(5, 150, 105, 0.95)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <CheckCircle2 size={12} /> Photo Attached ({photoFile ? (photoFile.size / 1024 / 1024).toFixed(1) + ' MB' : 'Ready'})
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11.5px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={13} />
                  <span>Parcel photo verified & attached</span>
                </div>
              </div>
            ) : isCameraActive ? (
              <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000000' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxHeight: '230px',
                    objectFit: 'cover',
                    display: cameraLoading ? 'none' : 'block',
                    borderRadius: '10px'
                  }}
                />
                {cameraLoading && (
                  <div style={{ padding: '36px 20px', color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <LoaderCircle className="spin" size={28} />
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>Starting camera...</span>
                  </div>
                )}
                {!cameraLoading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(6px)'
                  }}>
                    <button
                      type="button"
                      onClick={handleToggleCameraFacing}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Switch front/back camera"
                    >
                      <RefreshCw size={12} /> Switch
                    </button>

                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      style={{
                        height: '38px',
                        padding: '0 20px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 14px rgba(16, 185, 129, 0.5)',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px'
                      }}
                    >
                      <Camera size={16} /> Snap Photo
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.12)'
                }}>
                  <Camera size={22} />
                </div>
                <div style={{ fontSize: '13.5px', color: '#065f46', fontWeight: 800, marginBottom: '2px' }}>
                  Capture Delivery Proof Photo <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <p style={{ margin: '0 auto 12px', fontSize: '11.5px', color: '#047857', maxWidth: '380px', lineHeight: 1.4 }}>
                  Take a clear photo of the delivered parcel at the customer doorstep or handed over.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => startCamera('environment')}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Camera size={14} /> Open Camera
                  </button>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    style={{
                      height: '38px',
                      padding: '0 15px',
                      borderRadius: '10px',
                      border: '1.5px solid #a7f3d0',
                      background: '#ffffff',
                      color: '#059669',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <ImageIcon size={14} /> Choose from Gallery
                  </button>
                </div>

                <div style={{
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#065f46',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '4px 12px',
                  borderRadius: '20px'
                }}>
                  <ShieldCheck size={13} style={{ color: '#059669' }} />
                  <span>Mandatory proof · Auto-uploaded to Cloudinary</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Recipient Information Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} style={{ color: '#0284c7' }} />
                <span>Recipient Full Name</span>
                <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                type="text"
                required
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="Name of recipient"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  background: '#ffffff',
                  transition: 'all 0.15s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} style={{ color: '#0284c7' }} />
                <span>Recipient Phone Number</span>
              </span>
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="Contact number"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  background: '#ffffff',
                  transition: 'all 0.15s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </label>
          </div>

          {/* 4. COD Collection Input (If COD) */}
          {isCod && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fef9c3 100%)',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '17px' }}>💵</span>
                  <b style={{ fontSize: '13px', color: '#92400e' }}>Cash on Delivery (COD) Collection</b>
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '7px',
                  background: '#ffffff',
                  color: '#b45309',
                  border: '1px solid #fcd34d',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  Expected: {money(expectedAmount)}
                </span>
              </div>

              {/* Quick Cash Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#78350f' }}>Quick Tap:</span>
                <button
                  type="button"
                  onClick={() => setCollectedAmount(String(expectedAmount))}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '7px',
                    border: collectedNum === expectedAmount ? '1.5px solid #059669' : '1px solid #fcd34d',
                    background: collectedNum === expectedAmount ? '#ecfdf5' : '#ffffff',
                    color: collectedNum === expectedAmount ? '#065f46' : '#78350f',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={11} /> Exact {money(expectedAmount)}
                </button>
                {[100, 200, 500].filter(note => note > expectedAmount).map(note => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCollectedAmount(String(note))}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '7px',
                      border: collectedNum === note ? '1.5px solid #059669' : '1px solid #fcd34d',
                      background: collectedNum === note ? '#ecfdf5' : '#ffffff',
                      color: collectedNum === note ? '#065f46' : '#78350f',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ₹{note} note
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#78350f', display: 'block', marginBottom: '5px' }}>
                  Actual Cash Collected from Customer (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 800,
                    fontSize: '17px',
                    color: '#b45309'
                  }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={collectedAmount}
                    onChange={e => setCollectedAmount(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      border: '1.5px solid #f59e0b',
                      padding: '0 12px 0 32px',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#78350f',
                      background: '#ffffff',
                      outline: 'none',
                      boxShadow: '0 1px 3px rgba(245, 158, 11, 0.12)'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#d97706';
                      e.target.style.boxShadow = '0 0 0 3px rgba(217, 119, 6, 0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#f59e0b';
                      e.target.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.12)';
                    }}
                  />
                </div>
              </div>

              {/* Cash Return Helper */}
              {collectedNum > expectedAmount && (
                <div style={{
                  padding: '7px 11px',
                  borderRadius: '7px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🪙</span>
                  <span>Return change to customer: <b>{money(collectedNum - expectedAmount)}</b></span>
                </div>
              )}

              {collectedNum < expectedAmount && (
                <div style={{
                  padding: '7px 11px',
                  borderRadius: '7px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} />
                  <span>Under-collected by {money(expectedAmount - collectedNum)}. Order total is {money(expectedAmount)}.</span>
                </div>
              )}
            </div>
          )}

          {/* 5. Optional Customer OTP & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <KeyRound size={12} style={{ color: '#64748b' }} />
                <span>Customer Delivery OTP (Optional)</span>
              </span>
              <input
                type="text"
                maxLength="6"
                value={customerOtp}
                onChange={e => setCustomerOtp(e.target.value)}
                placeholder="e.g. 123456"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  outline: 'none',
                  background: '#ffffff'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={12} style={{ color: '#64748b' }} />
                <span>Delivery Notes</span>
              </span>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Handed to security"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  background: '#ffffff'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </label>
          </div>

          {/* Quick Note Presets for Rider Convenience */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-2px' }}>
            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>Quick notes (Tap to fill):</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                'Handed to Customer',
                'Left at Doorstep',
                'Handed to Security',
                'Received by Family Member'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNotes(preset)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: notes === preset ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                    background: notes === preset ? '#ecfdf5' : '#ffffff',
                    color: notes === preset ? '#065f46' : '#334155',
                    fontSize: '11.5px',
                    fontWeight: notes === preset ? 700 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: notes === preset ? '0 1px 3px rgba(16, 185, 129, 0.15)' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onMouseOver={e => {
                    if (notes !== preset) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseOut={e => {
                    if (notes !== preset) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Sticky Action Footer Bar */}
        <div className="modal-foot">
          <button
            type="button"
            disabled={uploading}
            onClick={handleModalClose}
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={uploading || !photoFile}
            style={{
              height: '44px',
              padding: '0 22px',
              borderRadius: '10px',
              border: 'none',
              background: !photoFile
                ? '#94a3b8'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: uploading || !photoFile ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: !photoFile
                ? 'none'
                : '0 4px 14px rgba(16, 185, 129, 0.32)',
              transition: 'all 0.15s ease'
            }}
          >
            {uploading ? (
              <>
                <LoaderCircle className="spin" size={16} />
                <span>Uploading Proof to Cloudinary...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Confirm Order Delivered</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
