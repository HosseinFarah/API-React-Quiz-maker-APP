import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { API_URL } from '../Components/Urls';
import { fetchCsrfToken } from '../utils/csrfUtils';

const CreateQuiz = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await fetchCsrfToken();
      const csrfToken = sessionStorage.getItem('csrf_token');

      const response = await fetch(`${API_URL}/quiz/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('Quiz created successfully');
      } else {
        throw new Error(result.message || 'Failed to create quiz');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Title</label>
        <input {...register('title', { required: true })} />
        {errors.title && <span>This field is required</span>}
      </div>
      <div>
        <label>Description</label>
        <textarea {...register('description', { required: true })} />
        {errors.description && <span>This field is required</span>}
      </div>
      <div>
        <label>Status</label>
        <input {...register('status', { required: true })} />
        {errors.status && <span>This field is required</span>}
      </div>
      <div>
        <label>Capacity</label>
        <input type="number" {...register('capacity', { required: true })} />
        {errors.capacity && <span>This field is required</span>}
      </div>
      <div>
        <label>Start Date</label>
        <input type="date" {...register('start_date', { required: true })} />
        {errors.start_date && <span>This field is required</span>}
      </div>
      <div>
        <label>Time Limit</label>
        <input type="number" {...register('time_limit', { required: true })} />
        {errors.time_limit && <span>This field is required</span>}
      </div>
      <div>
        <label>Shuffle Questions</label>
        <input type="checkbox" {...register('shuffle_questions')} />
      </div>
      <div>
        <label>Shuffle Options</label>
        <input type="checkbox" {...register('shuffle_options')} />
      </div>
      <button type="submit">Create Quiz</button>
    </form>
  );
};

export default CreateQuiz;
