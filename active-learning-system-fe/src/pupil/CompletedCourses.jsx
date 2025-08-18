import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { getCompletedCourses } from "../js/pupil/completedCoursesApi";
import { resolveImageUrl } from "../js/homepageApi";
import "../css/pupil/completedCourses.css";

const CompletedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Pupil"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const token = localStorage.getItem("token");
        
        if (!isLoggedIn || !token) {
          setError("Vui lòng đăng nhập để xem khóa học đã hoàn thành.");
          navigate("/login");
          return;
        }

        const data = await getCompletedCourses();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching completed courses:", err);
        setError(err.message || "Không thể tải danh sách khóa học đã hoàn thành.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCourses();
  }, [navigate]);

  const handleCourseClick = (course) => {
    // Navigate to learning interface with course data
    navigate(`/learning/${course.courseId}`, {
      state: {
        studentCourseId: course.studentCourseId || course.id,
        courseId: course.courseId,
        courseTitle: course.title
      }
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="completed-courses-container-completed-course">
          <div className="loading-spinner-completed-course">
            <div className="spinner-completed-course"></div>
            <p>Đang tải danh sách khóa học...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="completed-courses-container-completed-course">
        <div className="c1-completed-course">
          <div className="completed-courses-header-completed-course">
            <h1>🎓 Khóa Học Đã Hoàn Thành</h1>
            <p>Danh sách các khóa học bạn đã hoàn thành thành công</p>
          </div>
          <div className="courses-stats-completed-course">
            <div className="stat-card-completed-course">
              <span className="stat-number-completed-course">{courses.length}</span>
              <span className="stat-label-completed-course">Bài học đã hoàn thành</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message-completed-course">
            <div className="error-content-completed-course">
              <span className="error-icon-completed-course">⚠️</span>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn-completed-course">
                Thử lại
              </button>
            </div>
          </div>
        )}

        {!error && courses.length === 0 && (
          <div className="empty-state-completed-course">
            <div className="empty-icon-completed-course">📚</div>
            <h3>Chưa có khóa học nào được hoàn thành</h3>
            <p>Hãy tiếp tục học tập để hoàn thành khóa học đầu tiên của bạn!</p>
            <button 
              onClick={() => navigate("/courselist")} 
              className="browse-courses-btn-completed-course"
            >
              Khám phá khóa học
            </button>
          </div>
        )}

        {courses.length > 0 && (
          <div className="completed-courses-content-completed-course">
            <div className="courses-grid-completed-course">
              {courses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((course, index) => (
                <div key={course.courseId || index} className="course-card-completed-course">
                  <div className="c2-completed-course">
                    <div className="course-image-completed-course">
                      <img
                        src={resolveImageUrl(course.image, "course")}
                        className="img completed-course"
                        alt={course.courseName}
                        onError={(e) => {
                          e.target.src = "/images/course-placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="course-content-completed-course">
                      <h3 className="course-title-completed-course">{course.courseName}</h3>
                      <p className="enrolled-date-completed-course">
                        📅 Ngày bắt đầu: {course.startDate ? new Date(course.startDate).toLocaleDateString("vi-VN") : "-"}
                      </p>
                      <p className="completion-date-completed-course">
                        🗓️ Ngày hoàn thành: {course.lastAccess ? new Date(course.lastAccess).toLocaleDateString("vi-VN") : "-"}
                      </p>
                      <div className="course-progress-completed-course">
                        <div className="progress-bar-completed-course">
                          <div className="progress-fill-completed-course" style={{ width: "100%" }}></div>
                        </div>
                        <span className="progress-text-completed-course">100% hoàn thành</span>
                      </div>
                      <div className="course-actions-completed-course">
                        <button
                          onClick={() => handleCourseClick(course)}
                          className="view-course-btn-completed-course"
                        >
                          Xem chi tiết
                        </button>
                        {course.certificateUrl && (
                          <button className="certificate-btn-completed-course">
                            📜 Chứng chỉ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {courses.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: currentPage === 1 ? '#eee' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Trước
                </button>
                {Array.from({ length: Math.ceil(courses.length / itemsPerPage) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #007bff',
                      background: currentPage === i + 1 ? '#007bff' : '#fff',
                      color: currentPage === i + 1 ? '#fff' : '#007bff',
                      fontWeight: currentPage === i + 1 ? 'bold' : 'normal',
                      cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(courses.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(courses.length / itemsPerPage)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: currentPage === Math.ceil(courses.length / itemsPerPage) ? '#eee' : '#fff', cursor: currentPage === Math.ceil(courses.length / itemsPerPage) ? 'not-allowed' : 'pointer' }}
                >
                  Tiếp
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CompletedCourses;
