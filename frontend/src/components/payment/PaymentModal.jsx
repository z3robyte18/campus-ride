import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { rideAPI, driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FALLBACK_UPI = 'campusride@upi';

const PaymentModal = ({ ride, onClose, onPaid }) => {
  const [method, setMethod] = useState('upi');
  const [step, setStep] = useState('choose');
  const [txnId, setTxnId] = useState('');
  const [driverUpi, setDriverUpi] = useState(null);
  const [loadingUpi, setLoadingUpi] = useState(true);

  useEffect(() => {
    if (ride.driver?._id || ride.driver) {
      const driverId = ride.driver?._id || ride.driver;
      driverAPI.getPublicInfo(driverId)
        .then(res => setDriverUpi(res.data.upiId || null))
        .catch(() => setDriverUpi(null))
        .finally(() => setLoadingUpi(false));
    } else {
      setLoadingUpi(false);
    }
  }, []);

  const activeUpi = driverUpi || FALLBACK_UPI;
  const upiString = `upi://pay?pa=${activeUpi}&pn=CampusRide&am=${ride.fare}&cu=INR&tn=Ride-${ride._id?.slice(-6) || 'PAY'}`;

  const handleCash = async () => {
    setStep('processing');
    setTimeout(async () => {
      try {
        await rideAPI.updateStatus(ride._id, { status: 'completed' });
        toast.success('Cash payment recorded ✅');
        setStep('done');
        setTimeout(onPaid, 1500);
      } catch {
        toast.error('Failed to record payment');
        setStep('choose');
      }
    }, 900);
  };

  const handleUPIConfirm = async () => {
    if (!txnId.trim()) return toast.error('Please enter transaction ID after paying');
    setStep('processing');
    setTimeout(async () => {
      try {
        await rideAPI.updateStatus(ride._id, { status: 'completed' });
        toast.success(`UPI payment confirmed ✅ (Txn: ${txnId})`);
        setStep('done');
        setTimeout(onPaid, 1500);
      } catch {
        toast.error('Failed to confirm payment');
        setStep('choose');
      }
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💳 Collect Payment</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="fare-display">
          <span className="fare-amount-big">₹{ride.fare}</span>
          <span className="fare-sub">{ride.pickupLocation?.name} → {ride.destination?.name}</span>
        </div>

        {step === 'choose' && (
          <>
            <div className="payment-methods">
              <button className={`method-btn ${method === 'upi' ? 'active' : ''}`} onClick={() => setMethod('upi')}>
                📱 UPI / QR Code
              </button>
              <button className={`method-btn ${method === 'cash' ? 'active' : ''}`} onClick={() => setMethod('cash')}>
                💵 Cash
              </button>
            </div>

            {method === 'upi' && (
              <div className="upi-section">
                {loadingUpi ? (
                  <div className="spinner" style={{ margin: '20px auto' }} />
                ) : (
                  <>
                    <div className={`upi-source-tag ${driverUpi ? 'personal' : 'default'}`}>
                      {driverUpi ? '✅ Your personal UPI is linked' : '⚠️ Using default UPI (add yours in settings)'}
                    </div>
                    <p className="upi-hint">Ask passenger to scan this QR or pay to UPI ID below</p>
                    <div className="qr-wrapper">
                      <QRCodeSVG
                        value={upiString}
                        size={190}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="upi-id-box">
                      <div>
                        <span className="upi-label">UPI ID</span>
                        <span className="upi-value">{activeUpi}</span>
                      </div>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(activeUpi);
                          toast.success('UPI ID copied!');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="upi-amount-row">
                      <span>Amount to collect:</span>
                      <strong>₹{ride.fare}</strong>
                    </div>
                    <div className="form-group" style={{ width: '100%', marginTop: 14 }}>
                      <label>Enter Transaction ID after passenger pays</label>
                      <input
                        placeholder="e.g. UPI123456789012"
                        value={txnId}
                        onChange={e => setTxnId(e.target.value)}
                      />
                    </div>
                    <button className="btn-primary full" onClick={handleUPIConfirm}>
                      ✅ Confirm UPI Payment
                    </button>
                  </>
                )}
              </div>
            )}

            {method === 'cash' && (
              <div className="cash-section">
                <div className="cash-instruction">
                  <span className="cash-icon">💵</span>
                  <p>Collect <strong>₹{ride.fare}</strong> cash from passenger</p>
                  <p className="cash-sub">Confirm once you have received the payment</p>
                </div>
                <button className="btn-success full" onClick={handleCash}>
                  ✅ Cash Received — Complete Ride
                </button>
              </div>
            )}
          </>
        )}

        {step === 'processing' && (
          <div className="payment-processing">
            <div className="spinner" />
            <p>Processing payment...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="payment-done">
            <div className="done-icon">✅</div>
            <h4>Payment Successful!</h4>
            <p>Ride completed. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
