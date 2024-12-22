import {Link} from 'react-router-dom'
import {FaExclamationTriangle} from 'react-icons/fa'
const NotFound = () => {
  return (
    <>
    <section className="text-center flex flex-col justify-center items-center h-96 mt-5" style={{ marginTop: "150px" }}>
      <FaExclamationTriangle className="text-danger fs-1 mb-5" />
      <h1 className="text-6xl font-bold mb-4 text-danger">404 Not Found</h1>
      <p className="text-xl mb-5">This page does not exist</p>
      <Link to="/"
        className="text-secondary btn btn-warning fs-5 mt-4">
          Go Back
        </Link>
    </section>
    </>
  )
}

export default NotFound