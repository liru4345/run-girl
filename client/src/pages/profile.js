import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await fetch('/api/profile', { credentials: 'include' });
        if (!profileRes.ok) throw new Error('Unauthorized');
        const profileData = await profileRes.json();
        setLoggedInUserId(profileData.id);

        const endpoint = id ? `/api/users/${id}` : '/api/profile';
        const res = await fetch(endpoint, { credentials: 'include' });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data);

        if (!id) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            bio: data.bio || '',
            profile_picture: null,
          });
        }
      } catch (err) {
        console.error('❌ Error fetching profile:', err);
        if (!id) window.location.href = '/login';
      }
    };

    fetchProfile();
  }, [id]);

  useEffect(() => {
    const lockScroll = showEditModal || showCancelModal;
    document.body.style.overflow = lockScroll ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [showEditModal, showCancelModal]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_picture') {
      setFormData((prev) => ({ ...prev, profile_picture: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null) formPayload.append(key, val);
    });

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        credentials: 'include',
        body: formPayload,
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Profile updated!');
        setUser(data.user);
        setShowEditModal(false);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      await axios.post(`/api/friends/${action}`, { userId });
      const res = await axios.get(`/api/users/${userId}`);
      //await refetchProfile(); // 🔥 Refresh the profile info!
      setUser(res.data);
    } catch (err) {
      console.error("❌ Action failed:", err);
    }
  };

  const confirmCancel = (userId) => {
    setPendingCancelId(userId);
    setShowCancelModal(true);
  };

  const cancelRequest = async () => {
    try {
      const res = await axios.post('/api/friends/cancel-request', { userId: pendingCancelId });
      if (res.status === 200) {
        setShowCancelModal(false);
        setPendingCancelId(null);
        const refreshedUser = await axios.get(`/api/users/${pendingCancelId}`);
        setUser(refreshedUser.data);
        //await refetchProfile();
      }
    } catch (err) {
      console.error("❌ Cancel request failed:", err);
    }
  };

  
  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow p-4 text-center">
            <div className="d-flex justify-content-center mb-3">
              <img src={user.profile_picture || "https://via.placeholder.com/150"} alt="Profile" className="rounded-circle" width={150} height={150} />
            </div>
            <h3 className="mb-1">{user.first_name} {user.last_name}</h3>
            <p className="text-muted mb-2">@{user.email ? user.email.split("@")[0] : `${user.first_name}${user.last_name}`}</p>
            <p className="lead">{user.bio || <em>No bio yet... ✨</em>}</p>

            <div className="d-flex justify-content-center gap-4 my-3">
              <div><strong>{user.followers_count || 0}</strong><div className="text-muted small">Followers</div></div>
              <div><strong>{user.following_count || 0}</strong><div className="text-muted small">Following</div></div>
            </div>

            <hr />

            <div className="d-flex justify-content-center gap-4 mt-3">
              {id ? (
                <>
                {user.status === "requested" ? (
                  <button className="btn btn-warning" onClick={() => confirmCancel(user.id)}>Requested</button>
                ) : (
                  <button
                    className={`btn btn-${user.status === 'following' ? 'outline-danger' : 'success'}`}
                    onClick={() => handleAction(user.id, user.status === 'following' ? 'unfollow' : 'request')}
                  >
                    {user.status === 'following' ? 'Unfollow' : 'Follow'}
                  </button>
                )}
                {user.status === 'following' && (
                  <button className="btn btn-outline-success" onClick={() => navigate(`/posts/${user.id}`)}>
                    📸 View Posts
                  </button>
                )}
              </>
              ) : (
                <>
                  <button className="btn btn-outline-primary" onClick={() => setShowEditModal(true)}>Edit Profile</button>
                  <button className="btn btn-outline-secondary">Settings</button>
                  <button className="btn btn-outline-success" onClick={() => navigate('/posts')}>📸 View Posts</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Profile</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" name="first_name" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" name="last_name" value={formData.last_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bio</label>
                    <textarea className="form-control" name="bio" value={formData.bio} onChange={handleChange}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Profile Picture</label>
                    <input type="file" className="form-control" name="profile_picture" onChange={handleChange} />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Follow Request Modal */}
      {showCancelModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Undo Follow Request</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this follow request?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={cancelRequest}>Yes, Undo Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
