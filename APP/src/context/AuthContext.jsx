import { createContext, useContext, useState } from 'react';
import { API_URL } from '../Components/Urls';
import { getCsrfToken } from '../utils/csrfUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('authTokens') || !!sessionStorage.getItem('authTokens')
  );
  const [isConfirmed, setIsConfirmed] = useState(
    JSON.parse(sessionStorage.getItem('isConfirmed')) || false
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const setAuth = (authState) => {
    setIsAuthenticated(authState);
  };

  const setAdmin = (adminState) => {
    setIsAdmin(adminState);
  };

  const logout = async () => {
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
        setUser(null);
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, setAuth, logout, isConfirmed, setIsConfirmed, isAdmin, setAdmin, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);