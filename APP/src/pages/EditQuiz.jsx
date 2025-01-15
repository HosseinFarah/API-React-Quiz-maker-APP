import { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { API_URL } from "../Components/Urls";
import { PacmanLoader } from 'react-spinners';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchCsrfToken } from "../utils/csrfUtils";
import { useForm } from "react-hook-form";
import { AuthContext } from "../context/AuthContext";

const EditQuiz = () => {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [serverErrors, setServerErrors] = useState({});
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useContext(AuthContext);
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm();

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`${API_URL}/quiz/${id}`);
                const data = await response.json();
                setQuiz(data.quiz);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching quiz:", error);
            }
        };
        fetchQuiz();
    }, [id]);


    const formatDateTimeLocal = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const onSubmit = async (data) => {
        try {
            await fetchCsrfToken();
            const csrfToken = sessionStorage.getItem("csrf_token");

            const formData = new FormData();
            for (const key in data) {
                if (key === "image" && data.image.length > 0) {
                    formData.append("image", data.image[0]);
                } else if (key === "image" && data.image.length === 0) {
                    formData.append("existing_image", quiz.image);
                } else if (key === "shuffle_questions") {
                    formData.append("shuffle_questions", data[key] ? "true" : "false");
                } else if (key === "start_date" || key === "end_date") {
                    formData.append(key, data[key]);
                } else {
                    formData.append(key, data[key]);
                }
            }

            const response = await fetch(`${API_URL}/quiz/edit/${id}`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                toast.success(result.message || "Quiz updated successfully");
                navigate("/");
            } else {
                if (result.errors) {
                    const fieldErrors = {};
                    for (const [field, messages] of Object.entries(result.errors)) {
                        fieldErrors[field] = messages.join(", ");
                        setError(field, { type: "server", message: messages.join(", ") });
                    }
                    setServerErrors(fieldErrors);
                } else {
                    throw new Error(result.message || "Failed to update quiz");
                }
            }
        } catch (error) {
            toast.error(error.message || "An error occurred. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ marginTop: "150px" }}>
                <div className="row d-flex justify-content-center">
                    <PacmanLoader color={'#123abc'} loading={loading} size={50} />
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: "150px" }}>
            <div className="row d-flex justify-content-center">
                <div className="col-md-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="form" encType="multipart/form-data">
                        <div className="mb-3">
                            <label htmlFor="title" className="form-label">Title</label>
                            <input defaultValue={quiz.title} {...register("title", { required: true })} className="form-control" />
                            {errors.title && <span className="text-danger">{errors.title.message || "This field is required"}</span>}
                            {serverErrors.title && <div className="text-danger">{serverErrors.title}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="description" className="form-label">Description</label>
                            <textarea defaultValue={quiz.description} {...register("description", { required: true })} className="form-control" />
                            {errors.description && <span className="text-danger">{errors.description.message || "This field is required"}</span>}
                            {serverErrors.description && <div className="text-danger">{serverErrors.description}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select defaultValue={quiz.status} {...register("status", { required: true })} className="form-select">
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                            {errors.status && <span className="text-danger">{errors.status.message || "This field is required"}</span>}
                            {serverErrors.status && <div className="text-danger">{serverErrors.status}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="attempt" className="form-label">attempt</label>
                            <input defaultValue={quiz.attempt} type="number" {...register("attempt", { required: true })} className="form-control" />
                            {errors.attempt && <span className="text-danger">{errors.attempt.message || "This field is required"}</span>}
                            {serverErrors.attempt && <div className="text-danger">{serverErrors.attempt}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="start_date" className="form-label">Start Date</label>
                            <input defaultValue={formatDateTimeLocal(quiz.start_date)} type="datetime-local" {...register("start_date", { required: true })} className="form-control" />
                            {errors.start_date && <span className="text-danger">{errors.start_date.message || "This field is required"}</span>}
                            {serverErrors.start_date && <div className="text-danger">{serverErrors.start_date}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="end_date" className="form-label">End Date</label>
                            <input defaultValue={formatDateTimeLocal(quiz.end_date)} type="datetime-local" {...register("end_date", { required: true })} className="form-control" />
                            {errors.end_date && <span className="text-danger">{errors.end_date.message || "This field is required"}</span>}
                            {serverErrors.end_date && <div className="text-danger">{serverErrors.end_date}</div>}
                        </div>
                        <div className="mb-3">
                            <label htmlFor="time_limit" className="form-label">Time Limit</label>
                            <input defaultValue={quiz.time_limit} type="number" {...register("time_limit", { required: true })} className="form-control" />
                            {errors.time_limit && <span className="text-danger">{errors.time_limit.message || "This field is required"}</span>}
                            {serverErrors.time_limit && <div className="text-danger">{serverErrors.time_limit}</div>}
                        </div>
                        <div className="mb-3">
                            <img src={`http://localhost:5000/static/uploads/quizzes/${quiz.image}`} className="img-fluid rounded mb-3 shadow-md" style={{ maxHeight: "200px" }} alt={quiz.title} />
                            <input type="file" {...register("image")} className="form-control" />
                            {serverErrors.image && <div className="text-danger">{serverErrors.image}</div>}
                        </div>
                        <div className="mb-3 form-check">
                            <input defaultChecked={quiz?.shuffle_questions} type="checkbox" {...register("shuffle_questions")} className="form-check-input" />
                            <label htmlFor="shuffle_questions" className="form-check-label">Shuffle Questions</label>
                            {serverErrors.shuffle_questions && <div className="text-danger">{serverErrors.shuffle_questions}</div>}
                        </div>
                        <button type="submit" className="btn btn-primary">Update Quiz</button>
                        <Link to="/" className="btn btn-secondary ms-2">Cancel</Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditQuiz;
