import React, { useEffect, useState } from 'react';
// ...existing code...

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
                setResults(data.results);
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
                <ul>
                    {results.map((result, index) => (
                        <li key={index}>
                            <p>Score: {result.overall_score}</p>
                            <p>Duration: {result.duration} seconds</p>
                            <p>Start Time: {new Date(result.start_time).toLocaleString()}</p>
                            <p>End Time: {new Date(result.end_time).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
            {maxScore !== null && (
                <div>
                    <h2>Maximum Score: {maxScore}</h2>
                </div>
            )}
        </div>
    );
};

export default QuizResults;
