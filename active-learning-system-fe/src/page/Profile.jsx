// File: Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import ManagerSidebar from "../Component/ManagerSidebar";
import MarketerSidebar from "../Component/MarketerSidebar";
import InstructorSidebar from "../Component/InstructorSidebar";
import "../css/page/profile.css";
import ChangePassword from "./Changepassword";
import PaidHistory from "../parent/PaidHistory";
import UnpaidHistory from "../parent/UnpaidHistory";
import MyCourseList from "../pupil/MyCourselist";
import MyCompleteCourseList from "../pupil/MyCompleteCourseList";
import {
  FaBookOpen,
  FaEdit,
  FaLock,
  FaCreditCard
} from "react-icons/fa";
import {
  fetchUserProfile,
  getMyCourses,
  getMyQuizResults,
  linkAccount,
  updateMyProfile,
} from "../js/profileApi";

const Profile = () => {
  const [showCourse, setShowCourse] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("edit");
  const [quizResults, setQuizResults] = useState([]);
  const [user, setUser] = useState({});
  const [role, setRole] = useState(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    Name: "",
    Address: "",
    Dob: "",
    Sex: "",
    Phone: "",
  });
  const token = localStorage.getItem("token");

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split("T")[0];

  /** ================= LẤY THÔNG TIN HỒ SƠ ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token từ localStorage:", token);

    if (!token) {
      setError("Vui lòng đăng nhập để xem thông tin!");
      navigate("/login");
      return;
    }

    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setRole(savedRole);
      console.log("✅ Role trong localStorage:", savedRole);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Đang lấy thông tin hồ sơ...");
        const data = await fetchUserProfile();
        console.log("Dữ liệu hồ sơ nhận được:", data);
        setUser(data);
        setProfileForm({
          Name: data.name || "",
          Address: data.address || "",
          Dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
          Sex: data.sex || "",
          Phone: data.phone || "",
        });
        setError("");
      } catch (err) {
        console.error("Lỗi khi lấy hồ sơ:", err);
        setError(err.message || "Không thể kết nối đến server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  /** ================= LẤY DỮ LIỆU KHÓA HỌC / QUIZ ================= */
  useEffect(() => {
    const loadTabData = async () => {
      setLoading(true);
      try {
        if (role === "Pupil") {
          if (activeTab === "courses") {
            const courses = await getMyCourses();
            console.log("Khóa học nhận được:", courses);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTabData();
  }, [activeTab, role]);

  /** ================= XỬ LÝ ROLE CHANGE ================= */
  useEffect(() => {
    if (role && role !== "Pupil" && user.roleName !== "Parent" &&
      !["edit", "changepassword", "paidhistory", "unpaidhistory"].includes(activeTab)) {
      setActiveTab("edit");
    }
  }, [role, activeTab, user.roleName]);

  /** ================= XỬ LÝ SỰ KIỆN ================= */
  const handleLinkAccount = async () => {
    if (!linkEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkEmail)) {
      setError("Vui lòng nhập email hợp lệ!");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const isLinkedEmail =
        (user.roleName === "Pupil" && user.linkedParentEmail === linkEmail) ||
        (user.roleName === "Parent" && user.linkedChildrenEmails?.includes(linkEmail));
      if (isLinkedEmail) {
        setError("Tài khoản đã tồn tại liên kết!");
        return;
      }

      const response = await linkAccount(linkEmail);
      setSuccessMessage("Liên kết tài khoản thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setLinkEmail("");
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        setUser(updatedProfile);
        localStorage.setItem("username", updatedProfile.name || "");
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      if (err.message?.includes("đã được liên kết") || err.message?.includes("exist") || err.message?.includes("already linked")) {
        setError("Tài khoản đã tồn tại liên kết!");
      } else {
        setError(err.message || "Liên kết tài khoản thất bại!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return; 
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!(file instanceof File)) {
        throw new Error("File ảnh không hợp lệ!");
      }
      const response = await updateMyProfile(profileForm, file);
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        let avatarUrl = updatedProfile.avatar?.startsWith("https")
          ? updatedProfile.avatar
          : updatedProfile.avatar
          ? `https://localhost:5000/${updatedProfile.avatar.startsWith("/") ? updatedProfile.avatar.slice(1) : updatedProfile.avatar}`
          : "https://localhost:5000/profile/default.jpg";
        localStorage.setItem("avatar", avatarUrl);
        window.dispatchEvent(new Event("avatar-updated"));
      }
      setSuccessMessage("Cập nhật ảnh đại diện thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Cập nhật ảnh đại diện thất bại! Vui lòng kiểm tra server hoặc file.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.Name || !profileForm.Address || !profileForm.Phone || !profileForm.Sex) {
      setError("Tên, địa chỉ, số điện thoại và giới tính không được để trống!");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateMyProfile(profileForm, null);
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        setUser(updatedProfile);
        localStorage.setItem("username", updatedProfile.name || "");
        window.dispatchEvent(new Event("storage"));
      }
      setSuccessMessage("Cập nhật hồ sơ thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Cập nhật hồ sơ thất bại!");
    } finally {
      setLoading(false);
    }
  };

  /** ================= HÀM HỖ TRỢ ================= */
  const getImageUrl = (path) => {
    // Ưu tiên lấy avatar mới nhất từ localStorage (nếu có)
    let avatarUrl = localStorage.getItem("avatar");
    if (avatarUrl) return avatarUrl;
    if (!path || path.includes("pic2.jpg")) return "https://localhost:5000/profile/default.jpg";
    return `https://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // Lắng nghe event avatar-updated để cập nhật lại user.avatar khi đổi ảnh
  useEffect(() => {
    const handleAvatarUpdated = () => {
      setUser((prev) => ({ ...prev, avatar: localStorage.getItem("avatar") }));
    };
    window.addEventListener("avatar-updated", handleAvatarUpdated);
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, []);

  /** ================= HIỂN THỊ NỘI DUNG ================= */
  const renderContent = () => {
    if (loading) return <div className="rm-loading">Đang tải...</div>;
    if (error) {
      return (
        <div className="rm-dashboard-content">
          <h2>Lỗi</h2>
          <p className="rm-error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="rm-submit-btn">Thử lại</button>
        </div>
      );
    }

    switch (activeTab) {
      case "courses":
        if (role !== "Pupil") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Khóa học của tôi</h2>
            <MyCourseList token={token} />
          </div>
        );
      case "completecourses":
        if (role !== "Pupil") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Đã hoàn thành</h2>
            <MyCompleteCourseList token={token} />
          </div>
        );
      case "password":
        if (role !== "Pupil" && user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        const isLinked =
          (user.roleName === "Pupil" && user.linkedParentEmail) ||
          (user.roleName === "Parent" && user.linkedChildrenEmails && user.linkedChildrenEmails.length > 0);

        const currentEmailLabel = user.roleName === "Pupil" ? "Email của học sinh" : "Email của phụ huynh";
        const linkedEmailLabel = user.roleName === "Pupil" ? "Email của phụ huynh" : "Email của học sinh";
        const linkedEmailDisplay = user.roleName === "Pupil"
          ? user.linkedParentEmail || "Chưa liên kết phụ huynh"
          : user.roleName === "Parent"
            ? user.linkedChildrenEmails?.join(", ") || "Chưa liên kết học sinh"
            : "Không xác định";

        const placeholderText = user.roleName === "Pupil"
          ? "Nhập email phụ huynh để liên kết"
          : "Nhập email học sinh để liên kết";

        return (
          <div className="rm-dashboard-content">
            <h2>LIÊN KẾT TÀI KHOẢN</h2>
            <div className="rm-link-account-section">
              <p><strong>{currentEmailLabel}:</strong> {user.email || "Chưa có email"}</p>
              <p><strong>{linkedEmailLabel}:</strong> {linkedEmailDisplay}</p>
              {!isLinked && (
                <>
                  <input
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder={placeholderText}
                    className="rm-form-input"
                    disabled={loading}
                  />
                  {error && <p className="rm-error-message">{error}</p>}
                  {successMessage && <p className="rm-report-success-message">{successMessage}</p>}
                  <button
                    onClick={handleLinkAccount}
                    className="rm-submit-btn"
                    disabled={loading || !linkEmail}
                  >
                    {loading ? "Đang xử lý..." : "Liên kết"}
                  </button>
                </>
              )}
              {isLinked && <p className="rm-report-success-message">Tài khoản đã được liên kết!</p>}
            </div>
          </div>
        );
      case "paidhistory":
        if (user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Lịch sử thanh toán</h2>
            <PaidHistory />
          </div>
        );
      case "unpaidhistory":
        if (user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Khoá học chưa thanh toán</h2>
            <UnpaidHistory />
          </div>
        );
      case "edit":
        return (
          <div className="rm-dashboard-content">
            <h2>CHỈNH SỬA HỒ SƠ</h2>
            <div className="rm-profile-form">
              <div className="rm-form-group">
                <label className="rm-form-label">Tên:</label>
                <input
                  type="text"
                  name="Name"
                  value={profileForm.Name}
                  onChange={handleProfileChange}
                  placeholder="Nhập tên"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Địa chỉ:</label>
                <input
                  type="text"
                  name="Address"
                  value={profileForm.Address}
                  onChange={handleProfileChange}
                  placeholder="Nhập địa chỉ"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Ngày sinh:</label>
                <input
                  type="date"
                  name="Dob"
                  value={profileForm.Dob}
                  onChange={handleProfileChange}
                  className="rm-form-input"
                  disabled={loading}
                  max={today}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Giới tính:</label>
                <select
                  name="Sex"
                  value={profileForm.Sex}
                  onChange={handleProfileChange}
                  className="rm-form-input"
                  disabled={loading}
                >
                  <option value="" disabled>Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Số điện thoại:</label>
                <input
                  type="tel"
                  name="Phone"
                  value={profileForm.Phone}
                  onChange={handleProfileChange}
                  placeholder="Nhập số điện thoại"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              {error && <p className="rm-error-message">{error}</p>}
              {successMessage && <p className="rm-report-success-message">{successMessage}</p>}
              <div className="rm-form-actions">
                <button
                  onClick={handleUpdateProfile}
                  className="rm-submit-btn"
                  disabled={loading}
                  style={{ padding: "10px 20px", width: "auto" }}
                >
                  {loading ? "Đang xử lý..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        );
      case "changepassword":
        return (
          <div className="rm-dashboard-content">
            <h2>ĐỔI MẬT KHẨU</h2>
            <ChangePassword />
          </div>
        );
      default:
        return (
          <div className="rm-dashboard-content">
            <h2>CHỈNH SỬA HỒ SƠ</h2>
            <p>Chọn một mục từ menu bên trái.</p>
          </div>
        );
    }
  };

  return (
    <>
      {(role === "Pupil" || role === "Parent") && <Header />}
      <div className="rm-report-manager-page">
        {role === "Manager" && <ManagerSidebar />}
        {role === "Marketer" && <MarketerSidebar />}
        {role === "Instructor" && <InstructorSidebar />}
        {(role === "Pupil" || role === "Parent" || role === "Manager" || role === "Marketer" || role === "Instructor") && (
          <aside className="rm-sidebar">
            <div className="profile-img-container">
              <img
                src={getImageUrl(user.avatar)}
                alt="Ảnh người dùng"
                className="profile-img"
              />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
                disabled={loading}
              />
              <label htmlFor="avatar-upload" className="choose-file-btn">
                Chọn file
              </label>
            </div>
            <h3>{user.name || localStorage.getItem("username") || "Chưa xác định"}</h3>
            <p>{user.email || "Chưa có email"}</p>
            <nav className="rm-menu">
              {role === "Pupil" && (
                <>
                  <div onClick={() => setShowCourse(!showCourse)} className="rm-menu-item">
                    <FaBookOpen size={16} /> Khóa học
                  </div>
                  {showCourse && (
                    <>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "courses" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("courses")}
                      >
                        • Khóa học của tôi
                      </div>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "completecourses" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("completecourses")}
                      >
                        • Đã hoàn thành
                      </div>
                    </>
                  )}
                </>
              )}
              <div
                className={`rm-menu-item ${activeTab === "edit" ? "rm-active" : ""}`}
                onClick={() => setActiveTab("edit")}
              >
                <FaEdit size={16} /> Chỉnh sửa hồ sơ
              </div>
              {(role === "Pupil" || user.roleName === "Parent") && (
                <div
                  className={`rm-menu-item ${activeTab === "password" ? "rm-active" : ""}`}
                  onClick={() => setActiveTab("password")}
                >
                  <FaLock size={16} /> Liên kết tài khoản
                </div>
              )}
              {user.roleName === "Parent" && (
                <>
                  <div onClick={() => setShowPayment(!showPayment)} className="rm-menu-item">
                    <FaCreditCard size={16} /> Thanh toán
                  </div>
                  {showPayment && (
                    <>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "paidhistory" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("paidhistory")}
                      >
                        • Lịch sử thanh toán
                      </div>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "unpaidhistory" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("unpaidhistory")}
                      >
                        • Khoá học chưa thanh toán
                      </div>
                    </>
                  )}
                </>
              )}
              <div
                className={`rm-menu-item ${activeTab === "changepassword" ? "rm-active" : ""}`}
                onClick={() => setActiveTab("changepassword")}
              >
                <FaLock size={16} /> Đổi mật khẩu
              </div>
            </nav>
          </aside>
        )}
        <main className="rm-main">{renderContent()}</main>
      </div>
      {(role === "Pupil" || role === "Parent") && <Footer />}
    </>
  );
};

export default Profile;