import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { API_URL } from "../Components/Urls";
import { fetchCsrfToken } from "../utils/csrfUtils";
import { useNavigate } from "react-router-dom";

const CreateQuiz = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();
  const [serverErrors, setServerErrors] = useState({});

  const navigate = useNavigate();
  const onSubmit = async (data) => {
    try {
      await fetchCsrfToken();
      const csrfToken = sessionStorage.getItem("csrf_token");

      const formData = new FormData();
      for (const key in data) {
        if (key === "shuffle_questions") {
          formData.append("shuffle_questions_enabled", data[key] ? "true" : "false");
        } else {
          formData.append(key, data[key]);
        }
      }
      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      const response = await fetch(`${API_URL}/quiz/create`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Quiz created successfully:", result);
        toast.success("Quiz created successfully");
        navigate("/");
      } else {
        console.error("Error creating quiz:", result);
        if (result.errors) {
          const fieldErrors = {};
          for (const [field, messages] of Object.entries(result.errors)) {
            fieldErrors[field] = messages.join(", ");
            setError(field, { type: "server", message: messages.join(", ") });
          }
          setServerErrors(fieldErrors);
        } else {
          throw new Error(result.message || "Failed to create quiz");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="container" style={{marginTop: "150px"}}>
      <div className="row d-flex justify-content-center">
        <div className="col-md-6">
          <form onSubmit={handleSubmit(onSubmit)} className="form" encType="multipart/form-data">
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Title</label>
              <input {...register("title", { required: true })} className="form-control" />
              {errors.title && <span className="text-danger">{errors.title.message || "This field is required"}</span>}
              {serverErrors.title && <div className="text-danger">{serverErrors.title}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea {...register("description", { required: true })} className="form-control" />
              {errors.description && <span className="text-danger">{errors.description.message || "This field is required"}</span>}
              {serverErrors.description && <div className="text-danger">{serverErrors.description}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select {...register("status", { required: true })} className="form-select">
                <option value="">Select Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              {errors.status && <span className="text-danger">{errors.status.message || "This field is required"}</span>}
              {serverErrors.status && <div className="text-danger">{serverErrors.status}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="attempt" className="form-label">attempt</label>
              <input type="number" {...register("attempt", { required: true })} className="form-control" />
              {errors.attempt && <span className="text-danger">{errors.attempt.message || "This field is required"}</span>}
              {serverErrors.attempt && <div className="text-danger">{serverErrors.attempt}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <input type="date" {...register("start_date", { required: true })} className="form-control" />
              {errors.start_date && <span className="text-danger">{errors.start_date.message || "This field is required"}</span>}
              {serverErrors.start_date && <div className="text-danger">{serverErrors.start_date}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <input type="date" {...register("end_date", { required: true })} className="form-control" />
              {errors.end_date && <span className="text-danger">{errors.end_date.message || "This field is required"}</span>}
              {serverErrors.end_date && <div className="text-danger">{serverErrors.end_date}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="time_limit" className="form-label">Time Limit</label>
              <input type="number" {...register("time_limit", { required: true })} className="form-control" />
              {errors.time_limit && <span className="text-danger">{errors.time_limit.message || "This field is required"}</span>}
              {serverErrors.time_limit && <div className="text-danger">{serverErrors.time_limit}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="image" className="form-label">Image</label>
              <input type="file" {...register("image")} className="form-control" />
              {serverErrors.image && <div className="text-danger">{serverErrors.image}</div>}
            </div>
            <div className="mb-3 form-check">
              <input type="checkbox" {...register("shuffle_questions")} className="form-check-input" />
              <label htmlFor="shuffle_questions" className="form-check-label">Shuffle Questions</label>
              {serverErrors.shuffle_questions && <div className="text-danger">{serverErrors.shuffle_questions}</div>}
            </div>
            <button type="submit" className="btn btn-primary">Create Quiz</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
