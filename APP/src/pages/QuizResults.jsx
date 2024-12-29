import React, { useEffect, useState } from 'react';

const QuizResults = ({ quizId }) => {
    const [results, setResults] = useState([]);
    const [maxScore, setMaxScore] = useState(null);
    const [error, setError] = useState(null);
    
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
        <div>
            <hr className='text-danger' />
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
                                <td>{formatDuration(result.duration)}</td>
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




