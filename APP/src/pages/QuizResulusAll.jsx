import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const QuizResultsAll = () => {
    const { quizId } = useParams(); // Extract quizId from URL parameters
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!quizId) return; // Ensure quizId is defined
        const fetchResults = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/quiz/${quizId}/all_results`, {
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
                          </tr>
                     </thead>
                     <tbody>
                          {results.map((result) => (
                            <tr key={result.id}>
                                <td>{result.user.firstname} {result.user.lastname}</td>
                                <td>{result.overall_score}</td>
                                <td>{result.duration} seconds</td>
                                <td>{new Date(result.start_time).toLocaleString()}</td>
                                <td>{new Date(result.end_time).toLocaleString()}</td>
                            </tr>
                            ))}
                        </tbody>
                </table>
                

            )}

        </div>
    );
};

export default QuizResultsAll;




