
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { API_URL } from '../Components/Urls';
import { fetchCsrfToken } from '../utils/csrfUtils';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ResetPasswordRequest = () => {
  const { register, handleSubmit, formState: { errors } ,reset} = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
    const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      await fetchCsrfToken();
      const csrfToken = sessionStorage.getItem('csrf_token');
      const response = await fetch(`${API_URL}/reset_password_request`, {
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
              <label htmlFor="email" className='form-label'>Email</label>
              <input type="email" {...register('email', { required: 'Email is required' })} className='form-control'/>
              {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}
            </div>
            <div className='ms-auto d-flex justify-content-end mt-2'>
              <button type="submit" className='btn btn-primary' disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordRequest;