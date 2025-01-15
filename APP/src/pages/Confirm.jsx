import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resendConfirmationEmail } from '../utils/csrfUtils';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../components/Urls';
import { getCsrfToken } from '../utils/csrfUtils';

const Confirm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(null); // Add state for token
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthConfirm, user: contextUser, logout, isConfirmed } = useAuth(); // Destructure isConfirmed from useAuth
  const queryParams = new URLSearchParams(location.search);
  const message = queryParams.get('message');

  const userFromStorage = JSON.parse(localStorage.getItem('user'));
  const [user, setUser] = useState(contextUser || userFromStorage || null); // Initialize user state with data from localStorage

  console.log("User Data in Confirm Page", user);

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
    const handleUserConfirm = async () => {
      if (user && user.confirmed === true && token || isConfirmed) {
        toast.success('Email already confirmed');
        navigate('/');
      }
      else if (user && token && user.confirmed === false) {
        toast.error('After login, with the valid token, your email will be confirmed');
        await logout(() => token ? navigate('/login?token=' + token) : navigate('/login'));
      }
      else if (!user && token) {
        toast.error('Please login first and confirm your account with the link sent to your email');
        await logout(() => navigate('/login?token=' + token));
      }
      else if (!user && !token) {
        toast.error('Please login first');
        await logout(() => navigate('/login'));
      }

    };
    handleUserConfirm();
  }, [user, token, navigate, logout, isConfirmed]);

  console.log('Is there any user data in Confirm Page?', user);
  

  useEffect(() => {
    if (user && token) {
      const confirmUser = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await fetch(`${API_URL}/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': await getCsrfToken()
            },
            body: JSON.stringify({ token }),
            credentials: 'include'
          });
          const result = await response.json();
          if (response.ok) {
            setAuthConfirm(true);
            toast.success('Email confirmed successfully');
            navigate('/');
          } else {
            setError(result.message);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      confirmUser();
    }
  }, [user, token, navigate, setAuthConfirm]);

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError('');
    try {
      await resendConfirmationEmail(user.user, navigate, logout, token); // Use token from state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      await logout(() => navigate('/login'));
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
            value={user ? user.user : ''}
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