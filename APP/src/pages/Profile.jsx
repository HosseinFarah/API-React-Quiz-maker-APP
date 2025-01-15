import {useState , useEffect} from 'react';
import { Link, useNavigation } from 'react-router-dom';
import { API_URL,IMAGE_URL_USER } from '../Components/Urls';
import { toast } from 'react-toastify';

const Profile = () => {
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_URL}/user-info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await response.json();
                console.log('Response data:', data); // Log the entire data object
                setUser(data); // Set user to data instead of data.user
                console.log('User data:', data);
            } catch (error) {
                console.error('Error fetching user:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Show loading message while fetching
    }

    if (error) {
        return <div>Error: {error}</div>; // Show error message if there's an error
    }

    if (!user) {
        return <div>Error: User data is not available</div>;
    }

    return (
        <div className='container' style={{marginTop: '150px'}}>
            <h1>{user.firstname } { user.lastname }</h1>
            {user ? (
                  <div className="row">
                  <div className="col-md-5 col-md-offset-3 mt-5">
                      <div className="card shadow-lg">
                          <div className="card-header bg-info shadow mb-5 text-white" style={{height: '90px'}}>
                              <h3 className="card-title">Profile</h3>
                              <img src={IMAGE_URL_USER + user.image} alt="Profile" className="img-thumbnail ms-auto" style={{width: '140px' , height:'150px'  , borderRadius: '50%' , marginTop: '10px', position: 'absolute' , top: '0' ,right: '10px' }} />
                          </div>
                          <div className="card-body mt-5">
                              <p><strong className="text-info"><i className="fa fa-user "></i> Fullname:</strong> { user.firstname } { user.lastname }</p>
                              <p><strong className="text-info"><i className="fa fa-envelope "></i> Email:</strong> { user.email }</p>
                              <p><strong className="text-info"><i className="fa fa-phone "></i> Phone:</strong> { user.phone }</p>
                              <p><strong className="text-info"><i className="fa fa-city "></i> City:</strong> { user.city }</p>
                              <p><strong className="text-info"><i className="fa fa-map-marker "></i> Address:</strong> { user.address }</p>
                              <p><strong className="text-info"><i className="fa fa-shipping-fast"></i> Zipcode:</strong> { user.zipcode }</p>
                          </div>
                          <div className="card-footer">
                              <p><strong>Last Login:</strong> { user.last_login}</p>
                              <p><strong>Member Since: { user.member_since } </strong> Days ago</p>
                              <div className="d-flex justify-content-end m-3">
                              <Link to={`/edit_profile/${user.id}`} className="btn btn-warning m-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Edit Profile"><i className="fa fa-edit"></i> </Link>
                              <Link to={`/update_password`} className="btn btn-primary m-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Change Password"><i className="fa fa-key"></i> </Link>
                              </div>
                      </div>
                  </div>
              </div>
          </div>
            ) : (
                <p>You are not logged in. <Link to='/login'>Login</Link></p>
            )}
            {error && <div>Error: {error}</div>}
        </div>
    );
}

export default Profile;