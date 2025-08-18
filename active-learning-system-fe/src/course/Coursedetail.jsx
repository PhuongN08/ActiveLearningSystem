import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { resolveImageUrl } from "../js/homepageApi";
import "../css/course/Coursedetail.css";

const CourseDetail = () => {
  const videoRef = React.useRef(null);

  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");

  useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
    
        const allowed = !token || ["Pupil", "Parent"].includes(role);
    
        if (!allowed) {
          setTimeout(() => navigate("/error"), 0);
        }
      }, [navigate]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`https://localhost:5000/api/course/detail/${courseId}`)
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setCourse(res.data);
        } else {
          setError("Dữ liệu khóa học không hợp lệ.");
        }
      })
      .catch((err) => {
        console.error("Error fetching course detail:", err);
        setError("Không thể tải chi tiết khóa học. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      setError("Vui lòng đăng nhập để đăng ký khóa học.");
      setTimeout(() => setError(null), 5000);
      navigate("/login");
      return;
    }

    setEnrollLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Phiên đăng nhập hết hạn.");

      await axios.post(
        "https://localhost:5000/api/registercourse/register",
        { CourseId: courseId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage("Đăng ký khóa học thành công");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Enrollment error:", err);
      console.error("Response data:", err.response?.data);
      
      let errorMessage;
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
        else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else {
        errorMessage = err.message || "Không thể đăng ký khóa học. Vui lòng kiểm tra lại.";
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setEnrollLoading(false);
    }
  };


  // Auto-pause video at 7 seconds
  React.useEffect(() => {
    if (!course?.securedLink) return;
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= 7) {
        video.pause();
        video.currentTime = 7;
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [course?.securedLink]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error && !course) return <div className="loading">{error}</div>;
  if (!course) return <div className="loading">Không tìm thấy khóa học.</div>;

  return (
    <>
      <Header />
      <div className="course-wrapper">
        <div className="course-detail-grid">
          {/* t1: course-header top-left */}
          <div className="t1-course-header">
            <div className="course-header">
              <h1 className="course-title-course-detail">
                <button
                  className="back-to-courselist-btn"
                  onClick={() => navigate('/courselist')}
                  style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-680%)', margin: 0, padding: '8px 18px', fontSize: 18, borderRadius: 6, border: 'none', background: '#f1f1f1', color: '#333', cursor: 'pointer', zIndex: 2 }}
                >
                  ← Quay lại
                </button>
                <span style={{ display: 'inline-block', width: '100%' }}>{course.courseName || "Không có tiêu đề"}</span>
              </h1>
              <div className="course-meta">
                <span>🗓️ {new Date(course.createdDate).toLocaleDateString("vi-VN")}</span>
                <span>✍️ {course.authorName || "Chưa xác định"}</span>
              </div>
              {course.securedLink && course.securedLink !== '' && (
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                  }}>
                    <div style={{
                      width: '95%',
                      minWidth: 320,
                      maxWidth: 700,
                      aspectRatio: '16/9',
                      position: 'relative',
                      background: '#000',
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginLeft: 0
                    }}>
                      <video
                        ref={videoRef}
                        src={course.securedLink}
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: 360,
                          objectFit: 'cover',
                          borderRadius: 8,
                          background: '#000',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                        }}
                        poster={course.image ? resolveImageUrl(course.image, "course") : undefined}
                      >
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                      {/* Overlay for demo duration */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 8,
                        textAlign: 'center',
                        pointerEvents: 'none',
                        color: '#fff',
                        fontSize: 13,
                        textShadow: '0 1px 4px #000',
                      }}>
                      
                      </div>
                    </div>
                  </div>
                 
                </div>
              )}
            </div>
          </div>
          {/* t2: course-image + course-sidebar top-right */}
          <div className="t2-course-sidebar">
            {course.image && (
              <img
                src={resolveImageUrl(course.image, "course")}
                alt={course.courseName || "Hình ảnh khóa học"}
                className="course-image"
              />
            )}
            <div style={{ width: '100%' }}>
              <aside className="course-sidebar">
                <div className="course-info">
                  <p><strong>Giá:</strong> {course.price?.toLocaleString() || "Chưa cập nhật"} VNĐ</p>
                  <p><strong>Danh mục:</strong> {course.categoryName || "Chưa xác định"}</p>
                  <p><strong>Lớp:</strong> {course.className || "Chưa xác định"}</p>
                </div>
                <button
                  className="enroll-button"
                  onClick={handleEnroll}
                  disabled={enrollLoading || !course.status || !isLoggedIn || role === 'Parent'}
                >
                  {enrollLoading ? "Đang xử lý..." : "Đăng ký khóa học"}
                </button>
                {/* Hiển thị message dưới nút đăng ký */}
                {successMessage && <p className="success-message-course-detail-public">{successMessage}</p>}
                {error && <p className="error-message-course-detail-public">{error}</p>}
              </aside>
            </div>
          </div>
          {/* t3: course-content below t1 */}
          <div className="t3-course-content">
            <div className="course-content">
              <div className="course-description">
                <h2>Mô tả khóa học</h2>
                <p>{course.description || "Chưa có mô tả"}</p>
              </div>
              <div className="module-list">
                <h2>📦 Các module</h2>
                <ul>
                  {(course.modules || []).map((mod) => (
                    <li key={mod.id}>{mod.moduleName}</li>
                  ))}
                </ul>
              </div>
              <div className="feedback-section">
                <ul>
                  {(course.feedbacks || []).map((fb, idx) => (
                    <li key={idx}>
                      <strong>{fb.userName}:</strong> {fb.comment}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetail;