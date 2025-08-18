import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { resolveImageUrl } from "../js/homepageApi";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt, FaUser } from "react-icons/fa";
import "../css/course/Courselist.css";

function Courselist() {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const pageSize = 8;
  const navigate = useNavigate();

  useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
    
        const allowed = !token || ["Pupil", "Parent"].includes(role);
    
        if (!allowed) {
          setTimeout(() => navigate("/error"), 0);
        }
      }, [navigate]);

  useEffect(() => {
    // Call public API - fix URL to match backend route
    axios
      .get(`https://localhost:5000/api/course/all?pageIndex=${page}&pageSize=${pageSize}`)
      .then((res) => {
        console.log("Public course API response:", res.data);
        // Handle both possible response structures
        const data = res.data.data || res.data.Data || res.data;
        setCourses(Array.isArray(data) ? data : []);
        setHasNext(data.length === pageSize);
      })
      .catch((err) => {
        console.error("Lỗi khi tải khóa học:", err);
        console.error("Error details:", err.response?.data);
        // If public API doesn't exist, try manager API with auth
        if (err.response?.status === 404) {
          // Fallback to manager API with authentication
          const token = localStorage.getItem("token");
          if (token) {
            axios
              .get(`https://localhost:5000/api/manager/course/all?pageIndex=${page}&pageSize=${pageSize}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((res) => {
                console.log("Manager course API response:", res.data);
                const data = res.data.data || res.data.Data || res.data;
                setCourses(Array.isArray(data) ? data : []);
                setHasNext(data.length === pageSize);
              })
              .catch((managerErr) => {
                console.error("Lỗi khi tải khóa học từ manager API:", managerErr);
                setCourses([]);
              });
          } else {
            setCourses([]);
          }
        } else {
          setCourses([]);
        }
      });
  }, [page]);

  // Hiển thị trực tiếp 8 bản ghi trên grid
  const displayCourses = courses.slice(0, 8);

  return (
    <>
      <Header />

      <div className="course-list-section">
        <h2><span className="course-list-highlight">📘</span> Danh sách khóa học</h2>

        {/* Grid hiển thị 8 khóa học */}
        <div className="course-list-grid">
          {displayCourses.map((course) => (
            <div key={course.courseId} className="course-list-card">
              <div className="course-list-card-image">
                <img src={resolveImageUrl(course.image, "course")} alt={course.courseName} />
              </div>
              <div className="course-list-card-content">
                <p className="course-list-date">
                  <FaRegCalendarAlt style={{ marginRight: "6px", color: "#888" }} />
                  {new Date(course.createdDate).toLocaleDateString("vi-VN")}
                </p>

                <h5
                  className="course-list-title"
                  onClick={() => navigate(`/course/${course.courseId}`)}
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.4",
                    margin: "12px 0",
                    minHeight: "42px",
                    cursor: "pointer",
                    color: "#ff6b35"
                  }}
                >
                  {course.courseName}
                </h5>

                <p className="course-list-category" style={{ marginBottom: "10px" }}>{course.categoryName}</p>
                <div className="course-list-meta">
                  <span className="course-list-author">
                    <FaUser style={{ marginRight: "6px", color: "#888" }} />
                    {course.authorName}
                  </span>
                  <div className="course-list-price">
                    <h5 style={{ color: '#ff6b35' }}>{course.price.toLocaleString()} VND</h5>
                  </div>
                </div>
              </div>
            </div>
          ))}
</div>

        {/* Phân trang */}
        <div className="course-list-pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span>Trang {page}</span>
          <button disabled={!hasNext} onClick={() => setPage(page + 1)}>
            Trang sau
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Courselist;