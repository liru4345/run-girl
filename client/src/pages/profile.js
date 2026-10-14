import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaPen, FaCalendarAlt, FaUserPlus, FaUserCheck, FaUserTimes, FaClock, FaLock } from 'react-icons/fa';
import Avatar from '../components/avatar';
import PostCard from '../components/postCard';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  // Visiting /profile/<your own id> is the same as your own profile.
  const isOwnProfile = !id || Number(id) === loggedInUserId;
  const canSeeRuns = isOwnProfile || user?.status === 'following';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await fetch('/api/profile', { credentials: 'include' });
        if (!profileRes.ok) throw new Error('Unauthorized');
        const profileData = await profileRes.json();
        setLoggedInUserId(profileData.id);

        const own = !id || Number(id) === profileData.id;
        let data = profileData;
        if (!own) {
          const res = await fetch(`/api/users/${id}`, { credentials: 'include' });
          if (!res.ok) throw new Error('User not found');
          data = await res.json();
        }
        setUser(data);

        if (own) {
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

  // Load runs: all of your own (public and private), or a friend's public runs once you follow them.
  useEffect(() => {
    if (!user || !canSeeRuns) {
      setPosts([]);
      return;
    }
    const loadPosts = async () => {
      try {
        if (isOwnProfile) {
          const [pub, priv] = await Promise.all([
            fetch('/api/posts/public', { credentials: 'include' }).then((r) => r.json()),
            fetch('/api/posts/private', { credentials: 'include' }).then((r) => r.json()),
          ]);
          const all = [...(Array.isArray(pub) ? pub : []), ...(Array.isArray(priv) ? priv : [])];
          setPosts(all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } else {
          const res = await fetch(`/api/posts/user/${user.id}`, { credentials: 'include' });
          const data = await res.json();
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('❌ Error loading runs:', err);
      }
    };
    loadPosts();
  }, [user, canSeeRuns, isOwnProfile]);

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
        setUser((prev) => ({ ...prev, ...data.user }));
        setShowEditModal(false);
        setSaveError('');
      } else {
        setSaveError(data.error || 'Could not save your profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError('Could not save your profile.');
    }
  };

  const handleAction = async (userId, action) => {
    try {
      await axios.post(`/api/friends/${action}`, { userId });
      const res = await axios.get(`/api/users/${userId}`);
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
      }
    } catch (err) {
      console.error("❌ Cancel request failed:", err);
    }
  };

  if (!user) return <p className="rh-subtle text-center mt-5">Loading…</p>;

  const handle = user.email ? user.email.split("@")[0] : `${user.first_name}${user.last_name}`.toLowerCase();
  const totalMiles = posts.reduce((sum, p) => sum + (Number(p.miles) || 0), 0);

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 680 }}>
      {/* Profile header */}
      <div className="rh-card p-0 overflow-hidden mb-4">
        <div className="rh-cover" />
        <div className="px-4 pb-4">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3" style={{ marginTop: -56 }}>
            <div className="rh-avatar-ring">
              <Avatar src={user.profile_picture} firstName={user.first_name} lastName={user.last_name} size={112} />
            </div>

            <div className="d-flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button className="rh-btn rh-btn-secondary" onClick={() => setShowEditModal(true)}>
                    <FaPen /> Edit profile
                  </button>
                  <button className="rh-btn rh-btn-secondary" onClick={() => navigate('/calender')}>
                    <FaCalendarAlt /> Calendar
                  </button>
                </>
              ) : user.status === "requested" ? (
                <button className="rh-btn rh-btn-secondary" onClick={() => confirmCancel(user.id)}>
                  <FaClock /> Requested
                </button>
              ) : user.status === 'following' ? (
                <button className="rh-btn rh-btn-secondary rh-unfollow" onClick={() => handleAction(user.id, 'unfollow')} aria-label={`Unfollow ${user.first_name}`}>
                  <span className="rh-when-idle"><FaUserCheck /> Following</span>
                  <span className="rh-when-hover"><FaUserTimes /> Unfollow</span>
                </button>
              ) : (
                <button className="rh-btn rh-btn-primary" onClick={() => handleAction(user.id, 'request')}>
                  <FaUserPlus /> Follow
                </button>
              )}
            </div>
          </div>

          <h3 className="fw-bold mt-3 mb-0">{user.first_name} {user.last_name}</h3>
          <div className="rh-subtle mb-2">@{handle}</div>
          <p className="mb-3">{user.bio || <span className="rh-subtle">No bio yet ✨</span>}</p>

          <div className="rh-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="rh-stat">
              <div className="rh-stat-value">{canSeeRuns ? posts.length : '–'}</div>
              <div className="rh-label">Runs</div>
            </div>
            <div className="rh-stat">
              <div className="rh-stat-value">{canSeeRuns ? Math.round(totalMiles * 10) / 10 : '–'}</div>
              <div className="rh-label">Miles</div>
            </div>
            <div className="rh-stat">
              <div className="rh-stat-value">{user.followers_count || 0}</div>
              <div className="rh-label">Followers</div>
            </div>
            <div className="rh-stat">
              <div className="rh-stat-value">{user.following_count || 0}</div>
              <div className="rh-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Runs */}
      <h5 className="fw-bold mb-3">{isOwnProfile ? 'Your runs' : `${user.first_name}'s runs`}</h5>
      {!canSeeRuns ? (
        <div className="rh-card text-center py-5">
          <FaLock className="mb-2" style={{ fontSize: '1.5rem', color: 'var(--rh-muted)' }} />
          <div className="rh-card-title">Runs are private</div>
          <p className="rh-subtle mb-0">Follow {user.first_name} to see their runs.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rh-card text-center py-5">
          <div style={{ fontSize: '2.5rem' }}>👟</div>
          <div className="rh-card-title mt-2">No runs yet</div>
          {isOwnProfile && (
            <button className="rh-btn rh-btn-primary mt-2" onClick={() => navigate('/start-run')}>Start a run</button>
          )}
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} author={user} />)
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(31, 31, 41, 0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--rh-radius)', border: 'none' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit profile</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="rh-label mb-1">First name</label>
                      <input type="text" className="form-control rh-input" name="first_name" value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="rh-label mb-1">Last name</label>
                      <input type="text" className="form-control rh-input" name="last_name" value={formData.last_name} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="rh-label mb-1">Email</label>
                      <input type="email" className="form-control rh-input" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="rh-label mb-1">Phone number</label>
                      <input type="tel" className="form-control rh-input" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                      <small className="rh-subtle">Only shown to friends watching your runs.</small>
                    </div>
                    <div className="col-12">
                      <label className="rh-label mb-1">Bio</label>
                      <textarea className="form-control rh-input" rows={3} name="bio" value={formData.bio} onChange={handleChange}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="rh-upload mb-0">
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="d-none" name="profile_picture" onChange={handleChange} />
                        {formData.profile_picture ? formData.profile_picture.name : 'Change profile photo'}
                      </label>
                    </div>
                  </div>
                </form>
                {saveError && <div className="rh-notice error mt-3">{saveError}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="rh-btn rh-btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="rh-btn rh-btn-primary" onClick={handleSubmit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Follow Request Modal */}
      {showCancelModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(31, 31, 41, 0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 'var(--rh-radius)', border: 'none' }}>
              <div className="modal-body p-4 text-center">
                <h5 className="fw-bold">Cancel follow request?</h5>
                <p className="rh-subtle">You can always send another one later.</p>
                <div className="d-flex justify-content-center gap-2">
                  <button className="rh-btn rh-btn-secondary" onClick={() => setShowCancelModal(false)}>Keep request</button>
                  <button className="rh-btn rh-btn-primary" onClick={cancelRequest}>Cancel request</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
