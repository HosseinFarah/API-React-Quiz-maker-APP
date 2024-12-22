import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export const AdminRoute = ({ children }) => {
    const {  isAdmin } = useContext(AuthContext);

    return isAdmin ? children : <Navigate to="*" />;
};

export const UnLogedInRoute = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);

    return isAuthenticated ? <Navigate to="/" /> : children;
}