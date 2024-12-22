import { Outlet } from 'react-router-dom';
import Navbar from '../Components/navbar';
import {ToastContainer} from 'react-toastify';
import {} from 'react-toastify/dist/ReactToastify.css';

const MainLayout = () => {
  return (
    <>
    <Navbar />
    <Outlet />
    <ToastContainer />
    </>
  )
}

export default MainLayout