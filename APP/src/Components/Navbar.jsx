import { NavLink } from "react-router-dom";
import logo from "../assets/react.svg";
import { FaBars } from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout,isAdmin } = useContext(AuthContext);

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
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">
                  Home
                </NavLink>
              </li>
              {isAuthenticated ? (
              <li className="nav-item">
                <NavLink className="nav-link" to="/todos">
                  Todos
                </NavLink>
              </li>
              ): null}  
              {isAdmin ? (
              <li className="nav-item">
                <NavLink className="nav-link" to="/newtodo">
                  New Todo
                </NavLink>
              </li>
              ): null}
            </ul>
            <ul className="navbar-nav ms-auto">
              {isAuthenticated ? (
                <li className="nav-item">
                  <button className="nav-link btn" onClick={logout}>
                    Logout
                  </button>
                </li>
              ) : (
                <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">
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
