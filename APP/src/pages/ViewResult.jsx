import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../components/Urls';
import { toast } from 'react-toastify';

const ViewResult = () => {
  const { quiz_id, result_id } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/${quiz_id}/results/${result_id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch result');
        }
        const data = await response.json();
        setResult(data.result);
      } catch (error) {
        console.error('Error fetching result:', error);
        toast.error('Failed to fetch result');
      }
    };

    fetchResult();
  }, [quiz_id, result_id]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (!result) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container" style={{ marginTop: '150px' }}>
        <Link to={`/quiz/${quiz_id}/results`} className="btn btn-primary mb-4">Back to Results</Link>
      <h2>Quiz Result</h2>
      <h3>{result.quiz_name}</h3>
      <p><strong>Start Time:</strong> {new Date(result.start_time).toLocaleString()}</p>
      <p><strong>End Time:</strong> {new Date(result.end_time).toLocaleString()}</p>
      <p><strong>Duration:</strong> {formatDuration(result.duration)}</p>
      <p><strong>Overall Score:</strong> {result.overall_score}</p>
      <div className="mt-4">
        {result.questions.map((question, qIndex) => (
          <div key={qIndex} className="mb-4">
            <h5>{question.text}</h5>
            <ul className="list-group">
              {question.answers.map((answer, aIndex) => (
                <li
                  key={aIndex}
                  className={`list-group-item ${answer.id === question.selected_answer ? (answer.is_correct ? 'list-group-item-success' : 'list-group-item-danger') : ''}`}
                >
                  {answer.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewResult;
