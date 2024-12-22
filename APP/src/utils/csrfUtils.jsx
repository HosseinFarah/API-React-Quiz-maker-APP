import { toast } from 'react-toastify';
import { API_URL } from '../Components/Urls';

export const fetchCsrfToken = async () => {
  try {
    const response = await fetch(`${API_URL}/csrf-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Ensure credentials are included
    });
    console.log('CSRF Token Response:', response);
    if (response.status === 403) {
      throw new Error('CSRF token not found or forbidden');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    const data = await response.json();
    sessionStorage.setItem('csrf_token', data.csrf_token);
    console.log('CSRF Token Fetched:', data.csrf_token);
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

export const resendConfirmationEmail = async (email, navigate, logout, token = null) => {
  try {
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (!csrfToken) {
      throw new Error('CSRF token is missing');
    }
    const response = await fetch(`${API_URL}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ email, token }) // Include token in the request body
    });

    const result = await response.json();
    console.log('Resend Confirmation Email Response:', response);
    console.log('Resend Confirmation Email Result:', result);
    if (response.ok) {
      toast.success('Confirmation email resent successfully.');
      logout();
    } else if (response.status === 401) {
      navigate('/login');
    } else if (response.status === 302) {
      navigate(response.url); // Handle redirect
    } else if (response.status === 400 && result.message === 'Invalid or expired token, please login again and request a new confirmation email') {
      console.log('Condition met: Invalid or expired token');
      toast.error('Invalid or expired token. Please login again and request a new confirmation email.');
      navigate('/');
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error('Error resending confirmation email:', err);
    throw new Error(err.message || 'An error occurred. Please try again.');
  }
};

export const getCsrfToken = async () => {
  let csrfToken = sessionStorage.getItem('csrf_token');
  if (!csrfToken) {
    await fetchCsrfToken();
    csrfToken = sessionStorage.getItem('csrf_token');
  }
  return csrfToken;
};

export const registerUser = async (userData) => {
  try {
    const csrfToken = await getCsrfToken();
    const formData = new FormData();
    for (const key in userData) {
      formData.append(key, userData[key]);
    }
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: formData // Send form data as FormData
    });

    const result = await response.json();
    console.log('Register User Response:', response);
    console.log('Register User Result:', result);
    if (response.ok) {
      toast.success('Registration successful. A confirmation email has been sent.');
      return result;
    } else {
      throw new Error(result.message || 'Registration failed');
    }
  } catch (err) {
    console.error('Error registering user:', err);
    throw new Error(err.message || 'An error occurred. Please try again.');
  }
};
