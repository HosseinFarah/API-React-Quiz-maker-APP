import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../Components/Urls';
import { toast } from 'react-toastify';
import { fetchCsrfToken, getCsrfToken } from "../utils/csrfUtils";

const QuizResultsAll = () => {
    const { quizId } = useParams(); // Extract quizId from URL parameters
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!quizId) return; // Ensure quizId is defined
        const fetchResults = async () => {
            try {
                const response = await fetch(`${API_URL}/quiz/${quizId}/all_results`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Error fetching results');
                }
                const data = await response.json();
                setResults(data.results.sort((a, b) => b.overall_score - a.overall_score)); // Sort results by score
            } catch (err) {
                setError(err.message);
            }
        };
        fetchResults();
    }, [quizId]);


    const handleDelete = (quizId, resultId) => async () => {
        if (!window.confirm('Are you sure you want to delete this result?')) return;
        try {
            await fetchCsrfToken();
            const csrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/quiz/${quizId}/delete_result/${resultId}`, {
                method: 'DELETE',
                headers: {
                    "X-CSRFToken": csrfToken,
                  },
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Error deleting result');
            }
            setResults(results.filter((result) => result.id !== resultId));
            toast.success('Selected result deleted successfully');
        } catch (err) {
            setError(err.message);
        }
    }

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs}h ${mins}m ${secs}s`;
      };


    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className='container' style={{ marginTop: '150px' }}>
            <hr className='text-danger' />
            <Link to={`/quiz/${quizId}`} className='btn btn-secondary m-2'><i className='fas fa-arrow-left'></i> Back to Quiz</Link>
            <br />
            <h1 className='badge bg-warning fs-3 text-primary shadow-lg'>Quiz Results</h1>
            {results.length === 0 ? (
                <p>No results found.</p>
            ) : (
               <table className="table table-striped table-hover">
                     <thead>
                          <tr>
                            <th>FirstName LastName</th>
                            <th>Score</th>
                            <th>Duration</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actions</th>
                          </tr>
                     </thead>
                     <tbody>
                          {results.map((result) => (
                            <tr key={result.id}>
                                <td>{result.user.firstname} {result.user.lastname}</td>
                                <td>{result.overall_score}</td>
                                <td>{formatDuration(result.duration)}</td>
                                <td>{new Date(result.start_time).toLocaleString()}</td>
                                <td>{new Date(result.end_time).toLocaleString()}</td>
                                <td>
                                    <Link to={`/quiz/${quizId}/results/${result.id}`} className='btn btn-secondary btn-sm me-3 text-light'><i className='fas fa-eye'></i> View</Link>
                                    <button className='btn btn-danger btn-sm' onClick={handleDelete(quizId, result.id)}><i className='fas fa-trash'></i> Delete</button>
                                </td>
                                
                            </tr>
                            ))}
                        </tbody>
                </table>
                

            )}

        </div>
    );
};

export default QuizResultsAll;




