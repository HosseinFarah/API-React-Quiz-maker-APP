import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { IMAGE_URL_USER } from "../components/Urls";

const Footer = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const userImage = user ? user.image : null;

  return (
    <footer
      className="bg-light text-center text-lg-start footer custom-footer"
      style={{
        bottom: "0",
        width: "100%",
        zIndex: "1000",
        height: "150px",
      }}
    >
      <div className="container">
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-md-7 ms-5 mt-5">
            <span className="badge bg-secondary fs-5 text-wrap text-light">
              © 2025 Developed by:
            </span>
            <Link
              className="text-dark ms-2"
              to="https://www.linkedin.com/in/hosseinfarah/"
              target="_blank"
            >
              <i className="fab fa-linkedin me-1 text-primary"></i> Hossein
              Farahkordmahaleh
            </Link>
          </div>
          <div className="col-md-3 d-flex justify-content-end me-5 mt-5 ">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-dark text-decoration-none">
                  <img
                    src={IMAGE_URL_USER + userImage}
                    alt="user"
                    className="rounded thumbnail me-2 shadow-lg"
                    style={{ width: "60px", height: "60px" }}
                  />
                </Link>
                <Link
                  to=""
                  className="text-dark mt-3 no-style text-decoration-none"
                  onClick={() => {
                    logout();
                  }}
                >
                  Logout
                </Link>
              </>
            ) : (
              <Link to="/login" className="text-dark text-decoration-none">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
