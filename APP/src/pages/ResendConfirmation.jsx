import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCsrfToken, resendConfirmationEmail } from '../utils/csrfUtils';
import { useAuth } from '../context/AuthContext';

const ResendConfirmation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const { setAuthConfirm, logout } = useAuth(); // Destructure logout from useAuth

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
        const loggedInEmail = sessionStorage.getItem('loggedInEmail');
        if (loggedInEmail) {
            setEmail(loggedInEmail);
        }
    }, []);

    const handleResendConfirmationEmail = async () => {
        setLoading(true);
        setError('');
        try {
            const token = new URLSearchParams(window.location.search).get('token');
            await fetchCsrfToken();
            await resendConfirmationEmail(email, navigate, logout, token); // Pass token as an argument
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '150px' }} className='container'>
            <div className="row d-flex justify-content-center">
                <div className="col-md-4">
                    <h2>Resend Confirmation Email</h2>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        placeholder="Enter your email"
                        className="form-control"
                        style={{ marginBottom: '1rem' }}
                    />
                    <button onClick={handleResendConfirmationEmail} disabled={loading} className='btn btn-primary' style={{ padding: '0.5rem 2rem' }}>
                        {loading ? 'Sending...' : 'Resend Confirmation Email'}
                    </button>
                    {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default ResendConfirmation;