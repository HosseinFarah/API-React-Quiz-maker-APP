import { Outlet } from "react-router-dom";
import Navbar from "../Components/navbar";
import { ToastContainer } from "react-toastify";
import {} from "react-toastify/dist/ReactToastify.css";
import Footer from "../Components/Footer";

const MainLayout = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar />
      <div style={{ flex: "1" }}>
        <Outlet />
        <ToastContainer />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
