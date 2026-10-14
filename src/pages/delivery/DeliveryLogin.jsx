import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Phone, Mail, LoaderCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui';
import { authService } from '../../services/auth.service';
import { BRAND } from '../../config/brand';
import brandMark from '../../assets/r2cart-mark.svg';

export function DeliveryLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authService.deliveryLogin({
        email: identifier.trim(),
        password
      });
      if (user) {
        navigate('/delivery/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid delivery credentials. Please check your login details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px 24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ecfdf5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            border: '2px solid #a7f3d0'
          }}>
            <Truck size={32} style={{ color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            {BRAND.name} Delivery Partner
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Field staff & delivery driver management portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Email or Mobile Number
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}>
                <Mail size={16} />
              </div>
              <input
                type="text"
                required
                autoCapitalize="none"
                placeholder="rider@r2cart.com or 9876543210"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px 0 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px 0 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{
              height: '46px',
              borderRadius: '8px',
              background: '#059669',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? <LoaderCircle className="spin" size={18} /> : <>Sign In as Delivery Partner <ArrowRight size={16} /></>}
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Account assigned by Store Super Admin.
          </p>
        </div>
      </div>
    </div>
  );
}
export default DeliveryLogin;
