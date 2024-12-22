import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resendConfirmationEmail } from '../utils/csrfUtils';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Confirm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(null); // Add state for token
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthConfirm, user, logout } = useAuth(); // Destructure logout from useAuth
  const queryParams = new URLSearchParams(location.search);
  const message = queryParams.get('message');

  useEffect(() => {
    const handleStorageChange = event => {
      if (event.key === 'confirm') {
        setAuthConfirm(event.newValue);
        console.log('localStorage item confirm has changed:', event.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setAuthConfirm]);

  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(location.search).get('token'); // Extract token from URL
    setToken(tokenFromUrl); // Store token in state
  }, [location.search]);

  useEffect(() => {
    if (!user) {
      navigate(`/login?token=${token}`); // Pass token to login page
    }
  }, [user, navigate, token]);

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError('');
    try {
      await resendConfirmationEmail(user, navigate, logout, token); // Use token from state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const otsikko = message || "You have not confirmed your email address yet.";
  const viesti = !message && 
    "We need to confirm your email address before you can use the service. " +
    "Please check your email inbox for a message with a confirmation link.";

  return (
    <div style={{ marginTop: '150px' }} className='container'>
      <div className="row d-flex justify-content-center">
        <div className="col-md-4">
          <h1>Hei!</h1>
          <h3>{otsikko}</h3>
          <p>{viesti}</p>
          <p>Do you need a new confirmation link?</p>
          <input
            type="email"
            value={user || ''}
            readOnly
            placeholder="Enter your email"
            className="form-control"
            style={{ marginBottom: '1rem' }}
          />
          <button onClick={handleResendConfirmation} disabled={loading} className='btn btn-primary' style={{ padding: '0.5rem 2rem' }}>
            {loading ? 'Sending...' : 'Resend Confirmation Email'}
          </button>

          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Confirm;