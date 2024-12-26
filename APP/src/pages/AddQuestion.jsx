import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import { API_URL } from "../components/Urls";
import { getCsrfToken } from "../utils/csrfUtils";

const AddQuestion = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue , formState: { errors } ,setError} = useForm({
    defaultValues: {
      text: "",
      format: "multiple_choice",
      options_format: "A,B,C,D",
      score: 1,
      shuffle_enabled: false,
      image: null,
      answers: [{ text: "", is_correct: false, image: null }],
    },
  });

  const [serverErrors, setServerErrors] = useState({});

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrf = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token);
    };
    fetchCsrf();
  }, []);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("csrf_token", csrfToken);
    Object.keys(data).forEach((key) => {
      if (key !== "answers" && key !== "image") {
        formData.append(key, data[key]);
      }
    });

    data.answers.forEach((answer, index) => {
      formData.append(`answers[${index}][text]`, answer.text);
      formData.append(`answers[${index}][is_correct]`, answer.is_correct ? "true" : "false");
      if (answer.image) {
        formData.append(`answers[${index}][image]`, answer.image[0]);
      }
    });

    if (data.image) {
      formData.append("image", data.image[0]);
    }

    // Log formData entries for debugging
    // console.log("Logging formData entries:");
    // for (let pair of formData.entries()) {
    //   console.log(pair[0] + ": " + pair[1]);
    // }
    // console.log("Finished logging formData entries.");

    try {
      const response = await fetch(
        `${API_URL}/quiz/${quizId}/create_question`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Question added successfully");
        navigate(`/quiz/${quizId}`);
      } else {
        const result = await response.json();
        if (result.errors) {
          const fieldErrors = {};
          for (const [field, messages] of Object.entries(result.errors)) {
            fieldErrors[field] = messages.join(", ");
            setError(field, { type: "server", message: messages.join(", ") });
          }
          setServerErrors(fieldErrors);
        } else {
          toast.error(result.message || "Failed to add question");
          throw new Error(result.message || "Failed to create quiz");
        }
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container" style={{ marginTop: "120px" }}>
      <div className="row d-flex justify-content-center">
        <div className="col-md-7">
          <h2>Add Question</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            encType="multipart/form-data"
            noValidate
            className="form needs-validation"
          >
            <div>
              <label htmlFor="text" className="form-label"> Question Text</label>
              <textarea
                {...register("text", { required: true })}
                className="form-control"
              />
              {errors.text && <div className="text-danger">This field is required</div>}
              {serverErrors.text && <div className="text-danger">{serverErrors.text}</div>}
            </div>
            <div>
              <label htmlFor="format" className="form-label">Format</label>
              <select
                {...register("format", { required: true })}
                className="form-select"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
              </select>
              {errors.format && <div className="text-danger">This field is required</div>}
              {serverErrors.format && <div className="text-danger">{serverErrors.format}</div>}
            </div>
            <div>
              <label htmlFor="options_format" className="form-label">Options Format</label>
              <select {...register("options_format")} className="form-select">
                <option value="A,B,C,D">A,B,C,D</option>
                <option value="1,2,3,4">1,2,3,4</option>
              </select>
              {errors.options_format && <div className="text-danger">This field is required</div>}
              {serverErrors.options_format && <div className="text-danger">{serverErrors.options_format}</div>}  
            </div>
            <div>
              <label htmlFor="score" className="form-label">Score</label>
              <input
                type="number"
                {...register("score", { required: true })}
                className="form-control"
              />
              {errors.score && <div className="text-danger">This field is required</div>}
              {serverErrors.score && <div className="text-danger">{serverErrors.score}</div>}
            </div>
            <div>
              <label htmlFor="shuffle_enabled" className="form-label">Shuffle Enabled</label>
              <input
                type="checkbox"
                {...register("shuffle_enabled")}
                className="form-check-input"
              />
              {errors.shuffle_enabled && <div className="text-danger">This field is required</div>}
              {serverErrors.shuffle_enabled && <div className="text-danger">{serverErrors.shuffle_enabled}</div>}
            </div>
            <div>
              <label htmlFor="image" className="form-label">Question Image</label>
              <input
                type="file"
                {...register("image")}
                className="form-control"
              />
              {errors.image && <div className="text-danger">This field is required</div>}
              {serverErrors.image && <div className="text-danger">{serverErrors.image}</div>}
            </div>
            <div>
              <h3 className="mt-4">Answers</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="shadow-lg p-3 mb-5 bg-body rounded mt-3">
                  <label htmlFor="text" className="form-label">Answer Text</label>
                  <textarea
                    type="text"
                    {...register(`answers.${index}.text`, { required: true })}
                    className="form-control"
                  />
                  {errors.answers && errors.answers[index] && errors.answers[index].text && <div className="text-danger">This field is required</div>}
                  {serverErrors.answers && serverErrors.answers[index] && serverErrors.answers[index].text && <div className="text-danger">{serverErrors.answers[index].text}</div>}
                  <label htmlFor="is_correct" className="form-label mt-1">Is Correct</label>
                  <input
                    type="checkbox"
                    {...register(`answers.${index}.is_correct`)}
                    className="form-check-input mt-2 ms-1"
                  />
                  {errors.answers && errors.answers[index] && errors.answers[index].is_correct && <div className="text-danger">This field is required</div>}
                  {serverErrors.answers && serverErrors.answers[index] && serverErrors.answers[index].is_correct && <div className="text-danger">{serverErrors.answers[index].is_correct}</div>}
                  <div>
                  <label htmlFor="image" className="form-label">Answer Image</label>
                  <input
                    type="file"
                    {...register(`answers.${index}.image`)}
                    className="form-control mb-2"
                  />
                  {errors.answers && errors.answers[index] && errors.answers[index].image && <div className="text-danger">This field is required</div>}
                  {serverErrors.answers && serverErrors.answers[index] && serverErrors.answers[index].image && <div className="text-danger">{serverErrors.answers[index].image}</div>}
                  </div>
                  <button type="button" onClick={() => remove(index)} className="btn btn-danger">
                    Remove Answer
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => append({ text: "", is_correct: false, image: null })} className="btn btn-primary">
                Add New Option
              </button>
            </div>
            <div className="d-flex justify-content-end mb-5">
            <button type="submit" className="btn btn-success mt-3">
              Add Question
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuestion;
