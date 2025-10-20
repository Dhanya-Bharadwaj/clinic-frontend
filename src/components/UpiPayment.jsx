// src/components/UpiPayment.jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import '../styles/UpiPayment.css';

const UpiPayment = ({ 
  amount = 1, 
  upiId = 'dhanyabharadwaj200403@oksbi', 
  phoneNumber = '8762624188',
  patientName,
  onPaymentComplete,
  onCancel 
}) => {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const qrRef = useRef(null);

  // Generate UPI payment URL - Simplified for maximum compatibility
  const generateUpiUrl = () => {
    // Using minimal parameters that work across all UPI apps
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent('Dr K Madhusudana Clinic')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Online Consultation')}`;
    return upiString;
  };

  // Generate QR code URL using UPI QR service
  const generateQrCodeUrl = () => {
    const upiUrl = generateUpiUrl();
    const qrSize = '250x250';
    // Using a more reliable QR code generator
    return `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(upiUrl)}&chs=${qrSize}&choe=UTF-8`;
  };

  const handlePaymentConfirm = () => {
    if (!transactionId.trim()) {
      alert('Please enter the transaction ID from your payment app');
      return;
    }
    setPaymentConfirmed(true);
    onPaymentComplete({
      transactionId: transactionId.trim(),
      amount,
      upiId,
      paymentMethod: 'UPI',
      timestamp: new Date().toISOString()
    });
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    alert('UPI ID copied to clipboard!');
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(phoneNumber);
    alert('Phone number copied to clipboard!');
  };

  if (paymentConfirmed) {
    return (
      <motion.div 
        className="upi-payment-success"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h4>Payment Received!</h4>
        <p>Your payment has been noted. We will verify and confirm your appointment shortly.</p>
        <p><strong>Transaction ID:</strong> {transactionId}</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="upi-payment-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="upi-payment-header">
        <h4>Pay via UPI</h4>
        <div className="payment-amount">
          <span className="amount">₹{amount}</span>
          <span className="amount-label">Consultation Fee</span>
        </div>
      </div>

      <div className="upi-payment-methods">
        {/* QR Code Section */}
        <div className="qr-code-section">
          <h5>Scan QR Code</h5>
          <div className="qr-code-container">
            <img 
              ref={qrRef}
              src={generateQrCodeUrl()} 
              alt="UPI QR Code"
              className="qr-code"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="qr-fallback" style={{ display: 'none' }}>
              <i className="fas fa-qrcode"></i>
              <p>QR Code unavailable</p>
            </div>
          </div>
          <p className="qr-instruction">
            Open any UPI app (PhonePe, Google Pay, Paytm, etc.) and scan this QR code
          </p>
          
          {/* Direct UPI Payment Button for Mobile */}
          <motion.a
            href={generateUpiUrl()}
            className="upi-pay-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="fas fa-mobile-alt"></i> Pay Now via UPI App
          </motion.a>
        </div>

        <div className="payment-divider">
          <span>OR</span>
        </div>

        {/* Manual UPI ID Section */}
        <div className="manual-upi-section">
          <h5>Pay Manually</h5>
          <div className="upi-details">
            <div className="upi-detail-item">
              <label>UPI ID:</label>
              <div className="upi-value">
                <span>{upiId}</span>
                <button 
                  type="button" 
                  onClick={copyUpiId}
                  className="copy-btn"
                  title="Copy UPI ID"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <div className="upi-detail-item">
              <label>Phone Number:</label>
              <div className="upi-value">
                <span>{phoneNumber}</span>
                <button 
                  type="button" 
                  onClick={copyPhoneNumber}
                  className="copy-btn"
                  title="Copy Phone Number"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <div className="upi-detail-item">
              <label>Amount:</label>
              <div className="upi-value">
                <span>₹{amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="payment-instructions">
        <h5>Payment Instructions:</h5>
        <ol>
          <li>Scan the QR code or use the UPI ID above</li>
          <li>Complete the payment of ₹{amount}</li>
          <li>Enter the transaction ID from your payment app below</li>
          <li>Click "Confirm Payment" to proceed</li>
        </ol>
      </div>

      {/* Transaction ID Input */}
      <div className="transaction-input">
        <label htmlFor="transaction-id">Transaction ID / Reference Number:</label>
        <input
          type="text"
          id="transaction-id"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter transaction ID from your payment app"
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="upi-payment-actions">
        <motion.button
          type="button"
          onClick={onCancel}
          className="cancel-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="button"
          onClick={handlePaymentConfirm}
          className="confirm-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!transactionId.trim()}
        >
          Confirm Payment
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UpiPayment;