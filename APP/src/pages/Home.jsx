import { useContext } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import AllQuizzes from "./AllQuizzes";

const Home = () => {
  const { isAdmin } = useContext(AuthContext);
  console.log('isAdmin in Home:', isAdmin); // Debug log
  

  return (
    <>
      <div className="container">
        <div className="row d-flex justify-content-center">
            <h2>Home</h2>
            <AllQuizzes />
        </div>
      </div>

    </>
  );
};

export default Home;
