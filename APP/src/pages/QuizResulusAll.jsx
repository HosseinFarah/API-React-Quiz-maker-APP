import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../Components/Urls';
import { toast } from 'react-toastify';
import { fetchCsrfToken, getCsrfToken } from "../utils/csrfUtils";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

    const scoreRanges = {
        '0-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51-60': 0,
        '61-70': 0,
        '71-80': 0,
        '81-90': 0,
        '91-100': 0,
    };

    results.forEach(result => {
        const score = result.overall_score;
        if (score <= 10) scoreRanges['0-10']++;
        else if (score <= 20) scoreRanges['11-20']++;
        else if (score <= 30) scoreRanges['21-30']++;
        else if (score <= 40) scoreRanges['31-40']++;
        else if (score <= 50) scoreRanges['41-50']++;
        else if (score <= 60) scoreRanges['51-60']++;
        else if (score <= 70) scoreRanges['61-70']++;
        else if (score <= 80) scoreRanges['71-80']++;
        else if (score <= 90) scoreRanges['81-90']++;
        else scoreRanges['91-100']++;
    });

    const chartData = {
        labels: Object.keys(scoreRanges),
        datasets: [
            {
                label: 'Number of Scores',
                data: Object.values(scoreRanges),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Overall Score Ranges',
            },
        },
    };

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
            {results.length > 0 && (
                <div className="my-4">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            )}
        </div>
    );
};

export default QuizResultsAll;




