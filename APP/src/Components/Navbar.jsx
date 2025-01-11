import { NavLink } from "react-router-dom";
import logo from "../assets/logo.webp";
import { FaBars } from "react-icons/fa";
import { useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { isAuthenticated, logout, isAdmin,isConfirmed,user } = useContext(AuthContext);
  const navigate = useNavigate();
  const navbarCollapseRef = useRef(null);

  const handleNavLinkClick = () => {
    if (navbarCollapseRef.current.classList.contains("show")) {
      navbarCollapseRef.current.classList.remove("show");
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-light bg-light shadow-sm fixed-top"
        style={{ width: "100vw" }}
      >
        <div className="container">
          <NavLink
            className="navbar-brand"
            href="#"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            data-bs-title=""
          >
            <img
              src={logo}
              alt=""
              width="101"
              height="101"
              className="rounded-circle"
            />
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <FaBars />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav" ref={navbarCollapseRef}>
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" onClick={handleNavLinkClick}>
                  Home
                </NavLink>
              </li>
              {isAdmin ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/create_quiz" onClick={handleNavLinkClick}>
                      Create New Quiz
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/all_users" onClick={handleNavLinkClick}>
                      All Users
                    </NavLink>
                  </li>
                </>
              ) : null}
            </ul>
            <ul className="navbar-nav ms-auto">
              {isAuthenticated || user ? (
                <>
                {isConfirmed ? (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile" onClick={handleNavLinkClick}>
                    Profile
                  </NavLink>
                </li>
                ) : null}
                
                <li className="nav-item">
                  <button className="nav-link btn" onClick={()=>{logout(()=>navigate('/login')); handleNavLinkClick();}}>
                    Logout
                  </button>
                </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/login" onClick={handleNavLinkClick}>
                      Login
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/register" onClick={handleNavLinkClick}>
                      Register
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
