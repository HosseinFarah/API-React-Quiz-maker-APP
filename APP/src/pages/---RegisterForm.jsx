import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { API_URL } from "../Components/Urls";
import { getCsrfToken } from "../utils/csrfUtils";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_URL}/cities`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
      if (data.image[0]) {
        formData.append("image", data.image[0]);
      }

      const csrfToken = await getCsrfToken(); // Get CSRF token
      formData.append('csrf_token', csrfToken); // Add CSRF token to form data

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          'X-CSRFToken': csrfToken, // Add CSRF token to headers
        },
        credentials: 'include', // Ensure credentials are included
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Registration successful. Please check your email to confirm your account.");
        reset(); // Reset form fields
        navigate("/login"); // Correct navigate function call
      } else {
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            setError(key, { type: "server", message: result.errors[key][0] });
          });
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container" style={{ marginTop: "150px" }}>
        <div className="row d-flex justify-content-center">
          <div className="col-md-6">
            <h2>Register</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  {...register("firstname", {
                    required: "First name is required",
                  })}
                  className="form-control"
                />
                {errors.firstname && (
                  <p className="text-danger">{errors.firstname.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  {...register("lastname", {
                    required: "Last name is required",
                  })}
                  className="form-control"
                />
                {errors.lastname && (
                  <p className="text-danger">{errors.lastname.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  {...register("email", { required: "Email is required" })}
                  className="form-control"
                />
                {errors.email && (
                  <p className="text-danger">{errors.email.message}</p>
                )}
              </div>
              {errors.email && errors.email.type === "server" && (
                <p className="text-danger">{errors.email.message}</p>
              )}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="form-control"
                />
                {errors.password && (
                  <p className="text-danger">{errors.password.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Confirmed Password</label>
                <input
                    type="password"
                    {...register("confirm_password", {
                        required: "Confirmed password is required",
                        validate: value =>
                            value === watch('password') || "Passwords do not match"
                    })}
                    className="form-control"
                />
                {errors.confirm_password && (
                    <p className="text-danger">{errors.confirm_password.message}</p>
                )}
                </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  {...register("address", { required: "Address is required" })}
                  className="form-control"
                />
                {errors.address && (
                  <p className="text-danger">{errors.address.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  {...register("zipcode", { required: "Zip code is required" })}
                  className="form-control"
                />
                {errors.zipcode && (
                  <p className="text-danger">{errors.zipcode.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  {...register("phone", {
                    required: "Phone number is required",
                  })}
                  className="form-control"
                />
                {errors.phone && (
                  <p className="text-danger">{errors.phone.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>City</label>
                <select
                  {...register("city", { required: "City is required" })}
                  className="form-control"
                >
                  <option value="">Select a city</option> {/* Add default option */}
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-danger">{errors.city.message}</p>
                )}
              </div>
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  {...register("image")}
                  className="form-control"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;