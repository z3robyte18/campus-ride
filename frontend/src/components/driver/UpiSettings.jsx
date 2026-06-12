import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { driverAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UpiSettings = () => {
  const { user, updateUser } = useAuth();
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const previewUpi = upiId || user?.upiId;
  const previewString = previewUpi
    ? `upi://pay?pa=${previewUpi}&pn=${encodeURIComponent(user?.name || 'Driver')}&cu=INR`
    : null;

  const handleSave = async () => {
    if (!upiId.trim()) return toast.error('Please enter a UPI ID');
    const upiRegex = /^[\w.\-]+@[\w]+$/;
    if (!upiRegex.test(upiId.trim())) return toast.error('Invalid UPI ID format (e.g. name@upi)');
    setLoading(true);
    try {
      const res = await driverAPI.updateUPI(upiId.trim());
      updateUser({ upiId: res.data.upiId });
      toast.success('UPI ID saved successfully! ✅');
      setEditing(false);
    } catch {
      toast.error('Failed to save UPI ID');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await driverAPI.updateUPI('');
      updateUser({ upiId: '' });
      setUpiId('');
      toast.success('UPI ID removed');
      setEditing(false);
    } catch {
      toast.error('Failed to remove UPI ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>📱 UPI Payment Settings</h3>
        {user?.upiId && (
          <span className="upi-linked-badge">✅ UPI Linked</span>
        )}
      </div>

      <p className="upi-settings-desc">
        Link your personal UPI ID so passengers pay directly to you. Your QR code will be shown during ride payment.
      </p>

      {!editing ? (
        <div className="upi-current">
          {user?.upiId ? (
            <>
              <div className="upi-id-box" style={{ marginBottom: 14 }}>
                <div>
                  <span className="upi-label">Your UPI ID</span>
                  <span className="upi-value">{user.upiId}</span>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(user.upiId);
                    toast.success('Copied!');
                  }}
                >
                  Copy
                </button>
              </div>

              <button
                className="btn-secondary"
                style={{ marginBottom: 10, width: '100%' }}
                onClick={() => setPreview(!preview)}
              >
                {preview ? 'Hide QR Preview' : '🔍 Preview Your Payment QR'}
              </button>

              {preview && previewString && (
                <div className="qr-preview-box">
                  <p className="qr-preview-label">Your payment QR code</p>
                  <div className="qr-wrapper" style={{ margin: '0 auto 12px' }}>
                    <QRCodeSVG value={previewString} size={170} level="H" includeMargin />
                  </div>
                  <p className="qr-preview-sub">Scan with any UPI app to pay <strong>{user.name}</strong></p>
                </div>
              )}

              <div className="upi-action-row">
                <button className="btn-primary" onClick={() => setEditing(true)}>✏️ Edit UPI ID</button>
                <button className="btn-danger" onClick={handleRemove} disabled={loading}>Remove</button>
              </div>
            </>
          ) : (
            <div className="upi-empty">
              <div className="upi-empty-icon">📱</div>
              <p>No UPI ID linked yet</p>
              <p className="upi-empty-sub">Link your UPI ID to receive payments directly</p>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>
                + Link UPI ID
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="upi-edit">
          <div className="form-group">
            <label>Your UPI ID</label>
            <input
              placeholder="e.g. yourname@paytm or 9876543210@upi"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              autoFocus
            />
            <p className="field-hint">Accepted formats: name@paytm, phone@upi, name@ybl, name@okicici, etc.</p>
          </div>

          <div className="upi-common-list">
            <p className="upi-common-label">Common UPI handles:</p>
            <div className="upi-chips">
              {['@paytm', '@upi', '@ybl', '@okicici', '@okhdfcbank', '@okaxis', '@ibl'].map(h => (
                <button
                  key={h}
                  className="upi-chip"
                  onClick={() => {
                    const base = upiId.split('@')[0] || '';
                    setUpiId(base + h);
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="upi-action-row">
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save UPI ID'}
            </button>
            <button className="btn-secondary" onClick={() => { setEditing(false); setUpiId(user?.upiId || ''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="upi-info-box">
        <strong>How it works:</strong>
        <ul>
          <li>When a passenger pays via UPI, your QR code is shown</li>
          <li>Passenger scans and pays ₹amount directly to your UPI</li>
          <li>You confirm by entering the transaction ID</li>
          <li>Ride is marked complete after confirmation</li>
        </ul>
      </div>
    </div>
  );
};

export default UpiSettings;
