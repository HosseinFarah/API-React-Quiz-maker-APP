import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom'; // Import useLocation
import { API_URL } from '../Components/Urls';
import { fetchCsrfToken } from '../utils/csrfUtils';
import { toast } from 'react-toastify';


const ResetPassword = () => {
  const location = useLocation(); // Use useLocation to get the current URL
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
 const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token'); // Extract token from query parameters

  const passwordValidation = {
    required: 'Password is required',
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/]{8,}$/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long'
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      await fetchCsrfToken();
      const csrfToken = sessionStorage.getItem('csrf_token');
      const response = await fetch(`${API_URL}/reset_password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        setMessage(result.message);
        navigate('/login');
      } else {
        toast.error(result.message);
        setMessage(result.message);
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '150px' }} className='container'>
      <div className="row d-flex justify-content-center">
        <div className="col-md-4">
          <h2>Reset Password</h2>
          {message && <p className='text-info'>{message}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className='form-group'>
            <div className='form-group'>
              <label htmlFor="password" className='form-label'>New Password</label>
              <input type="password" {...register('password', passwordValidation)} className='form-control'/>
              {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
            </div>
            <div className='form-group'>
              <label htmlFor="confirm_password" className='form-label'>Confirm Password</label>
              <input type="password" {...register('confirm_password', { required: 'Password confirmation is required' })} className='form-control'/>
              {errors.confirm_password && <p style={{ color: 'red' }}>{errors.confirm_password.message}</p>}
            </div>
            <div className='ms-auto d-flex justify-content-end mt-3'>
              <button type="submit" className='btn btn-primary' disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;