import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const QuizResults = ({ quizId }) => {
    const [results, setResults] = useState([]);
    const [maxScore, setMaxScore] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);
    console.log('User:', user); // Debug log for user
    
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/quiz/${quizId}/results`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Error fetching results');
                }
                const data = await response.json();
                setResults(data.results.sort((a, b) => b.overall_score - a.overall_score)); // Sort results by score
                setMaxScore(data.max_score);
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
        <div>
            <h1>Quiz Results</h1>
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
                                <td>{user.firstname} {user.lastname}</td>
                                <td>{result.overall_score}</td>
                                <td>{result.duration} seconds</td>
                                <td>{new Date(result.start_time).toLocaleString()}</td>
                                <td>{new Date(result.end_time).toLocaleString()}</td>
                            </tr>
                            ))}
                        </tbody>
                </table>
                

            )}
            {maxScore !== null && (
                <div>
                    <h2 className='badge bg-info fs-3'>Max Score: {maxScore}</h2>
                </div>
            )}
        </div>
    );
};

export default QuizResults;




