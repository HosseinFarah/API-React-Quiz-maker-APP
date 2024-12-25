import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../components/Urls';
import { getCsrfToken } from '../utils/csrfUtils';

const AddQuestion = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState({
    text: '',
    format: 'multiple_choice',
    options_format: 'A,B,C,D',
    score: 1,
    shuffle_enabled: false,
    image: null
  });
  const [answers, setAnswers] = useState([{ text: '', is_correct: false, image: null }]);
  
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    const fetchCsrf = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token);
    };
    fetchCsrf();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionData({ ...questionData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setQuestionData({ ...questionData, [name]: files[0] });
  };

  const handleAnswerChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newAnswers = answers.map((answer, i) => (
      i === index ? { ...answer, [name]: type === 'checkbox' ? checked : value } : answer
    ));
    setAnswers(newAnswers);
  };

  const handleAnswerFileChange = (index, e) => {
    const { name, files } = e.target;
    const newAnswers = answers.map((answer, i) => (
      i === index ? { ...answer, [name]: files[0] } : answer
    ));
    setAnswers(newAnswers);
  };

  const addAnswer = () => {
    setAnswers([...answers, { text: '', is_correct: false, image: null }]);
  };

  const removeAnswer = (index) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    Object.keys(questionData).forEach((key) => {
      formData.append(key, questionData[key]);
    });

    const answersDict = {};
    answers.forEach((answer, index) => {
      answersDict[index] = {
        text: answer.text,
        is_correct: answer.is_correct ? 'true' : 'false'
      };
      if (answer.image) {
        formData.append(`answers[${index}][image]`, answer.image);
      }
    });

    formData.append('answers', JSON.stringify(answersDict));

    if (questionData.image) {
      formData.append('image', questionData.image);
    }

    // Log formData entries for debugging
    console.log('Logging formData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    console.log('Finished logging formData entries.');

    try {
      const response = await fetch(`${API_URL}/quiz/${quizId}/create_question`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Question added successfully');
        navigate(`/quiz/${quizId}`);
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h2>Add Question</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate className='form' style={{ marginTop: '120px' }}>
        <div>
          <label>Question Text</label>
          <textarea name="text" value={questionData.text} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Format</label>
          <select name="format" value={questionData.format} onChange={handleInputChange}>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
          </select>
        </div>
        <div>
          <label>Options Format</label>
          <input type="text" name="options_format" value={questionData.options_format} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Score</label>
          <input type="number" name="score" value={questionData.score} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Shuffle Answers</label>
          <input type="checkbox" name="shuffle_enabled" checked={questionData.shuffle_enabled} onChange={(e) => setQuestionData({ ...questionData, shuffle_enabled: e.target.checked })} />
        </div>
        <div>
          <label>Question Image</label>
          <input type="file" name="image" onChange={handleFileChange} />
        </div>
        <div>
          <h3>Answers</h3>
          {answers.map((answer, index) => (
            <div key={index}>
              <label>Answer Text</label>
              <input type="text" name="text" value={answer.text} onChange={(e) => handleAnswerChange(index, e)} required />
              <label>Correct</label>
              <input type="checkbox" name="is_correct" checked={answer.is_correct} onChange={(e) => handleAnswerChange(index, e)} />
              <label>Answer Image</label>
              <input type="file" name="image" onChange={(e) => handleAnswerFileChange(index, e)} />
              <button type="button" onClick={() => removeAnswer(index)}>Remove Answer</button>
            </div>
          ))}
          <button type="button" onClick={addAnswer}>Add Answer</button>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AddQuestion;
