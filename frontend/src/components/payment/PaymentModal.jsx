import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { rideAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UPI_ID = 'campusride@upi';

const PaymentModal = ({ ride, onClose, onPaid }) => {
  const [method, setMethod] = useState('upi');
  const [step, setStep] = useState('choose'); // choose | qr | processing | done
  const [txnId, setTxnId] = useState('');

  const upiString = `upi://pay?pa=${UPI_ID}&pn=CampusRide&am=${ride.fare}&cu=INR&tn=RidePayment-${ride._id.slice(-6)}`;

  const handleCash = async () => {
    setStep('processing');
    setTimeout(async () => {
      try {
        await rideAPI.updateStatus(ride._id, { status: 'completed', paymentStatus: 'paid' });
        toast.success('Cash payment recorded ✅');
        setStep('done');
        setTimeout(onPaid, 1500);
      } catch {
        toast.error('Failed to record payment');
        setStep('choose');
      }
    }, 1000);
  };

  const handleUPIConfirm = async () => {
    if (!txnId.trim()) return toast.error('Please enter transaction ID');
    setStep('processing');
    setTimeout(async () => {
      try {
        await rideAPI.updateStatus(ride._id, { status: 'completed', paymentStatus: 'paid' });
        toast.success('UPI payment confirmed ✅');
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
          <span className="fare-sub">{ride.pickupLocation.name} → {ride.destination.name}</span>
        </div>

        {step === 'choose' && (
          <>
            <div className="payment-methods">
              <button
                className={`method-btn ${method === 'upi' ? 'active' : ''}`}
                onClick={() => setMethod('upi')}>
                📱 UPI / QR Code
              </button>
              <button
                className={`method-btn ${method === 'cash' ? 'active' : ''}`}
                onClick={() => setMethod('cash')}>
                💵 Cash
              </button>
            </div>

            {method === 'upi' && (
              <div className="upi-section">
                <p className="upi-hint">Ask passenger to scan this QR or pay to UPI ID</p>
                <div className="qr-wrapper">
                  <QRCodeSVG value={upiString} size={180} level="H" />
                </div>
                <div className="upi-id-box">
                  <span className="upi-label">UPI ID</span>
                  <span className="upi-value">{UPI_ID}</span>
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Enter Transaction ID after payment</label>
                  <input
                    placeholder="e.g. UPI123456789"
                    value={txnId}
                    onChange={e => setTxnId(e.target.value)}
                  />
                </div>
                <button className="btn-primary full" onClick={handleUPIConfirm}>
                  Confirm UPI Payment
                </button>
              </div>
            )}

            {method === 'cash' && (
              <div className="cash-section">
                <div className="cash-instruction">
                  <span className="cash-icon">💵</span>
                  <p>Collect <strong>₹{ride.fare}</strong> cash from passenger</p>
                </div>
                <button className="btn-success full" onClick={handleCash}>
                  ✅ Cash Received
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
