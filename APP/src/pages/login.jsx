import { useForm } from 'react-hook-form'; // Ensure this package is installed
import { useNavigate, useLocation,Link } from 'react-router-dom'; // Import useLocation
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';
import { PacmanLoader } from 'react-spinners';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../components/Urls';
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
    const [loginAttempt, setLoginAttempt] = useState(0); // Add state for login attempts
    const [timer, setTimer] = useState(0); // Add state for timer
    console.log("loginAttempt", loginAttempt);
    

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

//    store the timer and login attempt count in local storage
    useEffect(() => {
        const storedTimer = localStorage.getItem('loginTimer');
        const storedLoginAttempt = localStorage.getItem('loginAttempt');
        if (storedTimer) {
            setTimer(parseInt(storedTimer, 10));
        }
        if (storedLoginAttempt) {
            setLoginAttempt(parseInt(storedLoginAttempt, 10));
        }
    }, []);

    useEffect(() => {
        let interval;
        if (loginAttempt > 5) {
            const initialTimer = timer > 0 ? timer : 60;
            setTimer(initialTimer); // Set timer to 60 seconds or continue from stored timer
            interval = setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer <= 1) {
                        clearInterval(interval);
                        setLoginAttempt(0); // Reset login attempts after timer ends
                        localStorage.removeItem('loginTimer');
                        localStorage.removeItem('loginAttempt');
                        return 0;
                    }
                    const newTimer = prevTimer - 1;
                    localStorage.setItem('loginTimer', newTimer);
                    return newTimer;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loginAttempt, timer]);

    useEffect(() => {
        localStorage.setItem('loginAttempt', loginAttempt);
    }, [loginAttempt]);

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        try {
            await fetchCsrfToken(); // Fetch CSRF token before login
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
                    setUser(result); // Set the logged-in user data
                    localStorage.setItem('user', JSON.stringify(result)); // Store user data in localStorage
                    console.log('User Data After Login:', result);
                    
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
                    console.log("isConfirmed", result.confirmed);
                    toast.error('User is not confirmed. Please confirm your email.');
                    navigate('/confirm?token=' + token); // Pass token to confirm page
                }
            } else {
                if (result.message === 'Invalid or expired token, please login again and request a new confirmation email') {
                    toast.error(result.message);
                    navigate('/login'); // Rerender the login form
                } else {
                    
                    setError(result.message);
                    setLoginAttempt(loginAttempt + 1);
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
                    <h2 className='text-secondary m-2'>Login</h2>
                    {message && <p style={{ color: 'red' }}>{message}</p>} {/* Display message */}
                    <form onSubmit={handleSubmit(onSubmit)} className='form-group shadow-lg rounded p-4'>
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
                            <button type="submit" className='btn btn-primary' disabled={loading || loginAttempt > 5}>
                                {loading ? <PacmanLoader color='white' size={10}/> : 'Login'}
                            </button>

                            <span>{loginAttempt > 5 && <p style={{ color: 'red', marginTop: '1rem' }}>Too many login attempts. Please try again in {timer} seconds.</p>}</span>
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