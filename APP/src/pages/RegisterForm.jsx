import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../components/Urls";
import { fetchCsrfToken, getCsrfToken } from "../utils/csrfUtils";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [serverErrors, setServerErrors] = useState({});
  const [uploadImage, setUploadImage] = useState(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_URL}/cities`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadImage(e.target.files[0]);
    }
  };

  const handleRemovePreview = () => {
    setUploadImage(null);
    document.getElementById("imageInput").value = "";
  };

  const onSubmit = async (data) => {
    try {
      await fetchCsrfToken();
      const csrfToken = await getCsrfToken();

      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      if (data.image && data.image.length > 0) {
        formData.append('image', data.image[0]);
      }
      formData.forEach((value, key) => {
        console.log(key + " " + value);
      });

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
          "credentials": "include",
        },
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(
          "Registration successful. A confirmation email has been sent."
        );
        navigate("/login");
      } else {
        if (result.errors) {
          const fieldErrors = {};
          for (const [field, messages] of Object.entries(result.errors)) {
            fieldErrors[field] = messages.join(", ");
            setError(field, { type: "server", message: messages.join(", ") });
          }
          setServerErrors(fieldErrors);
        } else {
          throw new Error(result.message || "Registration failed");
        }
      }
    } catch (error) {
      toast.error(error.message || "An error occurred. Please try again.");
      if (error.response && error.response.data && error.response.data.errors) {
        const serverErrors = error.response.data.errors;
        console.log("Form validation errors:", serverErrors); // Debugging statement
        for (const key in serverErrors) {
          setError(key, {
            type: "server",
            message: serverErrors[key].join(", "),
          });
        }
      } else if (error.errors) {
        // Handle errors if they are directly in the error object
        const serverErrors = error.errors;
        console.log("Form validation errors:", serverErrors); // Debugging statement
        for (const key in serverErrors) {
          setError(key, {
            type: "server",
            message: serverErrors[key].join(", "),
          });
        }
      }
    }
  };

  return (
    <div style={{ marginTop: "150px" }} className="container">
      <div className="row d-flex justify-content-center">
        <div className="col-md-6 shadow rounded p-4 mb-5">
          <h2 className="text-secondary mt-1">Register</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="form-group">
            <div>
              <label htmlFor="firstname" className="form-label">
                First Name
              </label>
              <input
                {...register("firstname", { required: true })}
                className="form-control"
              />
              {errors.firstname && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.firstname && <div className="text-danger">{serverErrors.firstname}</div>}
            </div>
            <div>
              <label htmlFor="lastname" className="form-label">
                Last Name
              </label>
              <input
                {...register("lastname", { required: true })}
                className="form-control"
              />
              {errors.lastname && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.lastname && <div className="text-danger">{serverErrors.lastname}</div>}
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                {...register("email", { required: true })}
                className="form-control"
              />
              {errors.email && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.email && <div className="text-danger">{serverErrors.email}</div>}
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                {...register("password", { required: true })}
                className="form-control"
              />
              {errors.password && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.password && <div className="text-danger">{serverErrors.password}</div>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                {...register("confirm_password", {
                  required: true,
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                className="form-control"
              />
              {errors.confirm_password && (
                <span className="text-danger">
                  {errors.confirm_password.message || "This field is required"}
                </span>
              )}
              {serverErrors.confirm_password && <div className="text-danger">{serverErrors.confirm_password}</div>}
            </div>

            <div>
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <input
                {...register("address", { required: true })}
                className="form-control"
              />
              {errors.address && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.address && <div className="text-danger">{serverErrors.address}</div>}
            </div>
            <div>
              <label htmlFor="zipcode" className="form-label">
                Zip Code
              </label>
              <input
                {...register("zipcode", { required: true })}
                className="form-control"
              />
              {errors.zipcode && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.zipcode && <div className="text-danger">{serverErrors.zipcode}</div>}
            </div>
            <div>
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                {...register("phone", { required: true })}
                className="form-control"
              />
              {errors.phone && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.phone && <div className="text-danger">{serverErrors.phone}</div>}
            </div>
            <div>
              <label htmlFor="city" className="form-label">
                City
              </label>
              <select
                {...register("city", { required: true })}
                className="form-control"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <span className="text-danger">This field is required</span>
              )}
              {serverErrors.city && <div className="text-danger">{serverErrors.city}</div>}
            </div>
            <div>
              <label htmlFor="image" className="form-label">
                Profile Picture
              </label>
              <input
                type="file"
                id="imageInput"
                {...register("image", { required: true })}
                className="form-control"
                onChange={handleImageChange}
              />
              {uploadImage && (
                <>
                <img
                  src={URL.createObjectURL(uploadImage)}
                  alt="Uploaded"
                  className="img-thumbnail mt-2"
                  style={{ width: "200px" }}
                />
                <button
                  type="button"
                  onClick={handleRemovePreview}
                  className="btn btn-danger ms-2">
                  <i className="fas fa-close"></i>
                </button>
                </>
              )}

              {errors.image && (
                <span className="text-danger">
                  {errors.image.message || "This field is required"}
                </span>
              )}
              {serverErrors.image && <div className="text-danger">{serverErrors.image}</div>}
            </div>
            <div className="ms-auto d-flex justify-content-end mt-3">
              <button type="submit" className="btn btn-info mt-2 ">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
