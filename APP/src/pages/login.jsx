import { useForm } from 'react-hook-form';
import { useNavigate, useLocation,Link } from 'react-router-dom'; // Import useLocation
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';
import { PacmanLoader } from 'react-spinners';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../Components/Urls';
import { fetchCsrfToken } from '../utils/csrfUtils';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const location = useLocation(); // Use useLocation to get the current URL
    const { setAuth, setIsConfirmed, setAdmin, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState(null); // Add state for token
    const [message, setMessage] = useState(null); // Add state for message

    useEffect(() => {
        const fetchToken = async () => {
            try {
                await fetchCsrfToken();
            } catch (err) {
                setError(err.message);
            }
        };
        fetchToken();
    }, []);

    useEffect(() => {
        const tokenFromUrl = new URLSearchParams(location.search).get('token'); // Extract token from URL
        setToken(tokenFromUrl); // Store token in state
        const messageFromUrl = new URLSearchParams(location.search).get('message'); // Extract message from URL
        setMessage(messageFromUrl); // Store message in state
    }, [location.search]);

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        try {
            const csrfToken = sessionStorage.getItem('csrf_token');
            if (!csrfToken) {
                throw new Error('CSRF token is missing');
            }
            console.log('Token:', token); // Debug log for token
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ ...data, token }), // Include token in the request body
                credentials: 'include'
            });

            const result = await response.json();
            console.log('Server Response:', result);
            if (response.ok) {
                if (data.remember) {
                    localStorage.setItem('authTokens', JSON.stringify(result.authTokens));
                } else {
                    sessionStorage.setItem('authTokens', JSON.stringify(result.authTokens));
                }
                setAuth(true);
                setAdmin(result.admin);
                if (result.user) {
                    console.log('User Data:', result.user); // Debug log for user data
                    setUser(result.user); // Set the logged-in user data
                } else {
                    console.error('User data is missing in the response');
                }

                if (result.admin) {
                    console.log('Logged in user is an admin.');
                } else {
                    console.log('Logged in user is a regular user.');
                }

                setIsConfirmed(result.confirmed);
                sessionStorage.setItem('isConfirmed', JSON.stringify(result.confirmed));
                if (result.confirmed) {
                    toast.success('Login successful');
                    navigate('/');
                } else {
                    toast.error('User is not confirmed. Please confirm your email.');
                    navigate('/confirm');
                }
            } else {
                if (result.message === 'Invalid or expired token, please login again and request a new confirmation email') {
                    toast.error(result.message);
                    navigate('/login'); // Rerender the login form
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '150px' }} className='container'>
            <div className="row d-flex justify-content-center">
                <div className="col-md-4">
                    <h2>Login</h2>
                    {message && <p style={{ color: 'red' }}>{message}</p>} {/* Display message */}
                    <form onSubmit={handleSubmit(onSubmit)} className='form-group'>
                        <div className='form-group'>
                            <label htmlFor="email" className='form-label'>Email</label>
                            <input type="email" {...register('email', { required: 'Email is required' })} className='form-control'/>
                            {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}
                        </div>
                        <div className='form-group'>
                            <label className='form-label' htmlFor="password">Password</label>
                            <input type="password" {...register('password', { required: 'Password is required' })} className='form-control'/>
                            {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
                        </div>
                        <div className='form-group'>
                            <input type="checkbox" {...register('remember')} className='form-check-input' id="remember"/>
                            <label className='form-label ms-1' htmlFor="remember">Remember Me</label>
                        </div>
                        <div className='ms-auto d-flex justify-content-end'>
                            <button type="submit" className='btn btn-primary' disabled={loading}>
                                {loading ? <PacmanLoader color='white' size={10}/> : 'Login'}
                            </button>

                        </div>
                        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                    </form>
                    <div className='mt-3'>
                        <p><i className="fas fa-user-plus"></i> Don't have an account? <Link to="/register">Register </Link></p>
                        <p><i className="fas fa-key"></i> Forgot your password? <Link to="/reset_password_request">Reset Password </Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;