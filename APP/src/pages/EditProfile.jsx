import React, { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL, IMAGE_URL_USER } from "../components/Urls";
import { AuthContext } from "../context/AuthContext";

const EditProfile = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [serverErrors, setServerErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const { user } = useContext(AuthContext);
  const { userId } = useParams();
  const id = user ? user.id : null;

  useEffect(() => {
    if (!user) {
      navigate("/login"); // Redirect to login if user is not authenticated
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/user/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUserInfo(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [userId]);

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

  useEffect(() => {
    if (userInfo) {
      Object.keys(userInfo).forEach((key) => setValue(key, userInfo[key]));
    }
  }, [userInfo, setValue]);

  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_URL}/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    return data.csrf_token;
  };

  const onSubmit = async (formData) => {
    try {
      const csrfToken = await fetchCsrfToken();
      const formDataObj = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        if (key === "image") {
          if (value && value.length > 0) {
            // If new image is uploaded, append the file
            formDataObj.append(key, value[0]);
          }
        } else {
          formDataObj.append(key, value);
        }
      });

      // Append the existing image as a File object if no new image is uploaded
      if (!formData.image || formData.image.length === 0) {
        const existingImageUrl = `${IMAGE_URL_USER}${userInfo.image}`;
        const response = await fetch(existingImageUrl);
        const blob = await response.blob();
        const existingImageFile = new File([blob], userInfo.image, { type: blob.type });
        formDataObj.append("image", existingImageFile);
      }

      // Debugging the FormData content
      console.log("FormData content:");
      for (let [key, value] of formDataObj.entries()) {
        console.log(`keyName: ${key}, value: ${value}`);
      }

      const response = await fetch(`${API_URL}/update_profile/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formDataObj,
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("User updated successfully");
        Object.keys(result.user).forEach((key) =>
          setValue(key, result.user[key])
        ); // Update form values
        navigate("/profile");
      } else {
        console.error("Error updating user:", result);
        if (result.errors) {
          const fieldErrors = {};
          for (const [field, messages] of Object.entries(result.errors)) {
            fieldErrors[field] = messages.join(", ");
            setError(field, { type: "server", message: messages.join(", ") });
          }
          setServerErrors(fieldErrors);
        } else {
          throw new Error(result.message || "Failed to update user");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred while updating user");
    }
  };

  if (!userInfo) return <div>Loading...</div>;

  return (
    <div className="container" style={{ marginTop: "150px" }}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          {parseInt(userId) === id ? (
            <form onSubmit={handleSubmit(onSubmit)} className="container mt-4" encType="multipart/form-data">
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  {...register("firstname", {
                    required: "First name is required",
                  })}
                  className="form-control"
                  defaultValue={userInfo?.firstname || ""}
                />
                {errors.firstname && (
                  <span className="text-danger">{errors.firstname.message}</span>
                )}
                {serverErrors.firstname && (
                  <div className="text-danger">{serverErrors.firstname}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  {...register("lastname", { required: "Last name is required" })}
                  className="form-control"
                  defaultValue={userInfo?.lastname || ""}
                />
                {errors.lastname && (
                  <span className="text-danger">{errors.lastname.message}</span>
                )}
                {serverErrors.lastname && (
                  <div className="text-danger">{serverErrors.lastname}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  {...register("phone", { required: "Phone number is required" })}
                  className="form-control"
                  defaultValue={userInfo?.phone || ""}
                />
                {errors.phone && (
                  <span className="text-danger">{errors.phone.message}</span>
                )}
                {serverErrors.phone && (
                  <div className="text-danger">{serverErrors.phone}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <input
                  {...register("address", { required: "Address is required" })}
                  className="form-control"
                  defaultValue={userInfo?.address || ""}
                />
                {errors.address && (
                  <span className="text-danger">{errors.address.message}</span>
                )}
                {serverErrors.address && (
                  <div className="text-danger">{serverErrors.address}</div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <select
                  {...register("city", { required: "City is required" })}
                  className="form-control"
                  defaultValue={userInfo?.city || ""}
                >
                  {cities.map((city) => (
                    <option key={city} value={city} selected={city === userInfo.city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <span className="text-danger">{errors.city.message}</span>
                )}
                {serverErrors.city && (
                  <div className="text-danger">{serverErrors.city}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Zipcode</label>
                <input
                  {...register("zipcode", { required: "Zipcode is required" })}
                  className="form-control"
                  defaultValue={userInfo?.zipcode || ""}
                />
                {errors.zipcode && (
                  <span className="text-danger">{errors.zipcode.message}</span>
                )}
                {serverErrors.zipcode && (
                  <div className="text-danger">{serverErrors.zipcode}</div>
                )}
              </div>

              <div className="mb-3">
                <img
                  src={`${IMAGE_URL_USER}${userInfo.image}`}
                  alt="Profile"
                  className="img-thumbnail ms-auto shadow-lg"
                  style={{
                    width: "140px",
                    height: "150px",
                    borderRadius: "50%",
                    marginTop: "600px",
                    position: "absolute",
                    top: "0",
                    right: "500px",
                  }}
                />
                <label className="form-label">Profile Image</label>
                <input
                  {...register("image")}
                  type="file"
                  className="form-control"
                  accept="image/*"
                />
                {serverErrors.image && (
                  <div className="text-danger">{serverErrors.image}</div>
                )}
              </div>
              <div className="mb-3">
                <input
                  {...register("existing_image")}
                  type="hidden"
                  value={userInfo.image}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Update User
              </button>
              <Link to="/profile" className="btn btn-secondary ms-2">
                Cancel
              </Link>
            </form>
          ) : (
            <div>
              <h1>Unauthorized</h1>
              <p>You Do Not Have Permission To Edit This Profile</p>
              <Link to="/profile" className="btn btn-primary">
                Back to Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
