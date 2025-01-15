import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../Components/Urls';
import { getCsrfToken } from '../utils/csrfUtils';
import { useNavigation } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('authTokens') || !!sessionStorage.getItem('authTokens')
  );
  const [isConfirmed, setIsConfirmed] = useState(
    JSON.parse(sessionStorage.getItem('isConfirmed')) || false
  );
  const [isAdmin, setIsAdmin] = useState(
    JSON.parse(localStorage.getItem('isAdmin')) || false
  );
  const [user, setUser] = useState(null);


  const setAuth = (authState) => {
    setIsAuthenticated(authState);
  };

  const setAdmin = (adminState) => {
    setIsAdmin(adminState);
  };

  useEffect(() => {
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
  }, [isAdmin]);

  const logout = async (callback) => {
    try {
      const csrfToken = await getCsrfToken(); // Get CSRF token
      console.log('CSRF Token for logout:', csrfToken); // Log CSRF token
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken, // Add CSRF token to headers
        },
        credentials: 'include' // Ensure credentials are included
      });
      console.log('Logout Response:', response); // Log response
      if (response.ok || response.status === 403) {
        // Proceed with client-side logout even if the server responds with 403
        sessionStorage.removeItem('authTokens');
        localStorage.removeItem('authTokens');
        sessionStorage.removeItem('csrf_token'); // Ensure CSRF token is cleared
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsConfirmed(false); // Set isConfirmed to false
        setUser(null);
        localStorage.removeItem('user'); // Remove user data from localStorage
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('isConfirmed');
        sessionStorage.removeItem('isConfirmed');
        if(typeof callback === 'function') {
          callback();
        }
      } else {
        const result = await response.json();
        console.error('Logout failed:', result); // Log error response
        throw new Error(`Failed to logout: ${result.message}`);
      }
    } catch (err) {
      console.error('Logout error:', err);
      throw new Error('Failed to logout');
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      const fetchUser = async () => {
        try {
          const csrfToken = await getCsrfToken();
          const response = await fetch(`${API_URL}/user-info`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken
            }
          });
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Fetch user failed:', response.status, errorData);
            if (response.status === 401) {
              throw new Error('Unauthorized access');
            }
            throw new Error(`Failed to fetch user data: ${errorData.message}`);
          }
          const data = await response.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data)); // Store user data in localStorage
        } catch (error) {
          console.error('Fetch user error:', error);
          throw new Error('Failed to fetch user data');
        }
      };
      fetchUser();
    }
  }
  , [isAuthenticated]);
  


  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, setAuth, logout, isConfirmed, setIsConfirmed, isAdmin, setAdmin, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);