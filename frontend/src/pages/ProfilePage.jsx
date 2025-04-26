import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();

  // Handle image selection and conversion to base64, then update profile
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image); // Preview selected image
      await updateProfile({ profilePic: base64Image }); // Update profile picture
    };
  };

  return (
    <div>
      <h1>Profile</h1>

      {/* Profile Image Preview */}
      <div>
        <img
          src={selectedImg || authUser.profilePic || "/avatar.png"}
          alt="Profile"
          width="100"
          height="100"
        />
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUpdatingProfile}
          />
          <p>{isUpdatingProfile ? "Uploading..." : "Upload a new profile photo"}</p>
        </div>
      </div>

      {/* User Information */}
      <div>
        <p><strong>Name:</strong> {authUser?.name}</p>
        <p><strong>Email:</strong> {authUser?.email}</p>
        <p><strong>Member Since:</strong> {authUser.createdAt?.split("T")[0]}</p>
        <p><strong>Account Status:</strong> Active</p>
      </div>

      {/* Back to Home Button */}
      <div>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    </div>
  );
};

export default ProfilePage;
