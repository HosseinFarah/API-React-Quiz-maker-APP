import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { registerUser } from '../utils/csrfUtils';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../Components/Urls';

const RegistrationForm = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_URL}/cities`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, []);

  const onSubmit = async (data) => {

    try {
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      await registerUser(formData);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>First Name</label>
        <input {...register('firstname', { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zåäöA-ZÅÄÖ'\-]+$/ })} />
        {errors.firstname && <span>Only letters, hyphens and apostrophes allowed</span>}
      </div>
      <div>
        <label>Last Name</label>
        <input {...register('lastname', { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zåäöA-ZÅÄÖ'\-]+$/ })} />
        {errors.lastname && <span>Only letters, hyphens and apostrophes allowed</span>}
      </div>
      <div>
        <label>Email</label>
        <input {...register('email', { required: true, pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/ })} />
        {errors.email && <span>Invalid email address</span>}
      </div>
      <div>
        <label>Password</label>
        <input type="password" {...register('password', { required: true, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/]{8,}$/ })} />
        {errors.password && <span>Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long</span>}
      </div>
      <div>
        <label>Confirm Password</label>
        <input type="password" {...register('confirm_password', { required: true, validate: value => value === watch('password') })} />
        {errors.confirm_password && <span>Passwords do not match</span>}
      </div>
      <div>
        <label>Address</label>
        <input {...register('address', { required: true, pattern: /^[a-zåäöA-ZÅÄÖ0-9'\- ]+$/ })} />
        {errors.address && <span>Only letters, numbers, hyphens and apostrophes allowed</span>}
      </div>
      <div>
        <label>Zip Code</label>
        <input {...register('zipcode', { required: true, pattern: /^[0-9]{5}$/ })} />
        {errors.zipcode && <span>Zip code must be 5 digits long</span>}
      </div>
      <div className="form-group">
        <label>City</label>
        <select
          {...register("city", { required: "City is required" })}
          className="form-control"
        >
            <option value="">Select city</option>
            {cities.map(city => (
                <option key={city} value={city}>
                {city}
                </option>
            ))}
        </select>
        {errors.city && <span>{errors.city.message}</span>}
        </div>
        
          
      <div>
        <label>Phone Number</label>
        <input {...register('phone', { required: true, pattern: /^[\d\s\-\+\(\)]{1,15}$/ })} />
        {errors.phone && <span>Phone number must have at most 15 digits and can contain numbers, spaces, hyphens, plus signs and parentheses</span>}
      </div>
      <div>
        <label>Profile Picture</label>
        <input type="file" {...register('image', { required: true })} />
        {errors.image && <span>Only jpg, png, jpeg, webp and gif files allowed. Image size must be less than 1MB</span>}
      </div>
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default RegistrationForm;