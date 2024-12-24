import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';

const CreateQuestion = ({ quizId }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      options: [{ option_text: '', option_image: '', score: 0 }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options'
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('question', data.question);
    formData.append('order_number', data.order_number);
    formData.append('question_type_id', data.question_type_id);
    if (data.image[0]) {
      formData.append('image', data.image[0]);
    }
    data.options.forEach((option, index) => {
      formData.append(`options[${index}][option_text]`, option.option_text);
      formData.append(`options[${index}][score]`, option.score);
      if (option.option_image[0]) {
        formData.append(`options[${index}][option_image]`, option.option_image[0]);
      }
    });

    try {
      const response = await axios.post(`/api/quiz/${quizId}/add_question`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Question added successfully:', response.data);
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Question</label>
        <input {...register('question', { required: true })} />
        {errors.question && <span>This field is required</span>}
      </div>
      <div>
        <label>Order Number</label>
        <input type="number" {...register('order_number', { required: true })} />
        {errors.order_number && <span>This field is required</span>}
      </div>
      <div>
        <label>Question Type ID</label>
        <input type="number" {...register('question_type_id', { required: true })} />
        {errors.question_type_id && <span>This field is required</span>}
      </div>
      <div>
        <label>Image</label>
        <input type="file" {...register('image')} />
      </div>
      <div>
        <label>Options</label>
        {fields.map((field, index) => (
          <div key={field.id}>
            <input {...register(`options.${index}.option_text`, { required: true })} placeholder="Option Text" />
            <input type="file" {...register(`options.${index}.option_image`)} />
            <input type="number" {...register(`options.${index}.score`, { required: true })} placeholder="Score" />
            <button type="button" onClick={() => remove(index)}>Remove Option</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ option_text: '', option_image: '', score: 0 })}>Add Option</button>
      </div>
      <button type="submit">Add Question</button>
    </form>
  );
};

export default CreateQuestion;
