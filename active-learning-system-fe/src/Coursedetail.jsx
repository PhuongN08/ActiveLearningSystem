// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import Header from "./Component/Header";
// import Footer from "./Component/Footer";
// import { resolveImageUrl } from "./js/homepageApi";
// import "./css/Coursedetail.css";

// const CourseDetail = () => {
//   const { courseId } = useParams(); // Lấy courseId từ URL
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null); // Luôn hiển thị lỗi khi có
//   const [successMessage, setSuccessMessage] = useState(""); // Luôn hiển thị thông báo thành công
//   const [enrollLoading, setEnrollLoading] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     setLoading(true);
//     setError(null); // Xóa lỗi cũ khi tải lại
//     axios
//       .get(`https://localhost:5000/api/manager/course/detail/${courseId}`, { timeout: 5000 })
//       .then((response) => {
//         if (response.data && typeof response.data === "object") {
//           setCourse(response.data);
//         } else {
//           setError("Dữ liệu khóa học không hợp lệ.");
//         }
//       })
//       .catch((error) => {
//         console.error("Lỗi khi lấy chi tiết khóa học:", error);
//         setError("Không thể tải chi tiết khóa học. Vui lòng thử lại.");
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, [courseId]);

//   useEffect(() => {
//     // Add role check when component mounts
//     const role = localStorage.getItem("role");
//     setUserRole(role);
//   }, []);

//   const handleEnroll = async () => {
//     if (!isLoggedIn) {
//       setError("Vui lòng đăng nhập để đăng ký khóa học.");
//       setTimeout(() => setError(null), 5000);
//       navigate("/login");
//       return;
//     }

//     // Add role validation
//     if (userRole !== "pupil") {
//       setError("Chỉ tài khoản học sinh mới có thể đăng ký khóa học.");
//       setTimeout(() => setError(null), 5000);
//       return;
//     }

//     setEnrollLoading(true);
//     setError(null); // Xóa lỗi cũ trước khi thử đăng ký
//     setSuccessMessage(""); // Xóa thông báo thành công cũ
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Phiên đăng nhập hết hạn.");

//       const response = await axios.post(
//         "https://localhost:5000/api/registercourse/register",
//         { CourseId: courseId },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           timeout: 5000,
//         }
//       );
//       console.log("Phản hồi từ server khi đăng ký:", response.data);
//       setSuccessMessage("Đăng ký khóa học thành công");
//       setTimeout(() => setSuccessMessage(""), 5000); // Xóa thông báo sau 5 giây
//     } catch (err) {
//       console.error("Lỗi khi đăng ký:", err.response?.data || err.message);
//       if (err.response?.status === 400) {
//         // Handle unlinked pupil error
//         if (err.response.data === "Vui lòng liên kết với tài khoản phụ huynh để đăng ký khóa học!") {
//           setError("Vui lòng liên kết với tài khoản phụ huynh để đăng ký khóa học!");
//         } else {
//           setError("Khóa học đã đăng ký");
//         }
//       } else {
//         const errorMessage =
//           err.response?.data?.message ||
//           err.message ||
//           "Không thể đăng ký khóa học. Vui lòng kiểm tra lại.";
//         setError(errorMessage);
//       }
//       setTimeout(() => setError(null), 5000); // Tự động xóa lỗi sau 5 giây
//     } finally {
//       setEnrollLoading(false);
//     }
//   };

//   // Giả định isLoggedIn từ localStorage
//   const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

//   if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
//   if (error && !course) return <div className="loading">{error}</div>; // Chỉ hiển thị lỗi toàn trang khi load ban đầu thất bại
//   if (!course) return <div className="loading">Không tìm thấy khóa học.</div>;

//   return (
//     <>
//       <Header />
//       <div className="course-wrapper">
//         <div className="course-container">
//           <h1 className="course-title">{course.courseName || "Không có tiêu đề"}</h1>
//           {course.image && (
//             <img
//               src={resolveImageUrl(course.image, "course")}
//               alt={course.courseName || "Hình ảnh khóa học"}
//               className="course-image"
//             />
//           )}
//           <p className="course-description">{course.description || "Chưa có mô tả"}</p>
//           <ul className="course-info">
//             <li>
//               <strong>Ngày tạo:</strong>{" "}
//               {course.createdDate
//                 ? new Date(course.createdDate).toLocaleDateString("vi-VN")
//                 : "Chưa xác định"}
//             </li>
//             <li>
//               <strong>Giá:</strong>{" "}
//               {course.price !== undefined && course.price !== null
//                 ? course.price.toLocaleString() + " VNĐ"
//                 : "Chưa cập nhật"}
//             </li>
//             <li>
//               <strong>Tác giả:</strong> {course.authorName || "Chưa xác định"}
//             </li>
//             <li>
//               <strong>Danh mục:</strong> {course.categoryName || "Chưa xác định"}
//             </li>
//             <li>
//               <strong>Lớp:</strong> {course.className || "Chưa xác định"}
//             </li>
//           </ul>
//           <div className="enroll-section9">
//             {userRole === "Pupil" ? (
//               <button
//                 className="enroll-button9"
//                 onClick={handleEnroll}
//                 disabled={enrollLoading || !course.status || !isLoggedIn}
//               >
//                 {enrollLoading ? "Đang xử lý..." : "Đăng ký khóa học"}
//               </button>
//             ) : null}
//             {successMessage && <p className="success-message9">{successMessage}</p>}
//             {error && <p className="error-message9">{error}</p>} {/* Luôn hiển thị lỗi khi có */}
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default CourseDetail;