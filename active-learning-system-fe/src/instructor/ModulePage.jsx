// import React, { useEffect, useMemo, useState } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import Header from "../Component/Header";
// import Footer from "../Component/Footer";
// import "../css/manager/ManagerCourseList.css";
// import "../css/manager/Module.css";

// function ModulePage() {
//   const { courseId } = useParams();
//   const numericCourseId = parseInt(courseId, 10);
//   const navigate = useNavigate();

//   // Validate courseId
//   useEffect(() => {
//     console.log("Course ID validation:", { courseId, numericCourseId });
//     if (!courseId || isNaN(numericCourseId) || numericCourseId <= 0) {
//       console.error("Invalid course ID");
//       setError("ID khóa học không hợp lệ");
//       setTimeout(() => navigate("/instructor/courses"), 2000);
//       return;
//     }
//     console.log("Course ID is valid:", numericCourseId);
//   }, [courseId, numericCourseId, navigate]);

//   const [modules, setModules] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [editingModule, setEditingModule] = useState(null);
//   const [editForm, setEditForm] = useState({ moduleName: "", description: "" });
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [newModule, setNewModule] = useState({ moduleName: "", description: "" });
//   const [processing, setProcessing] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");
//   const [confirmToggle, setConfirmToggle] = useState({ open: false, module: null });

//   // Helper function to get auth headers
//   const getAuthHeaders = () => {
//     const token = localStorage.getItem("token");
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   };

//   // Check authentication and authorization
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     const role = localStorage.getItem("role");
//     const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

//     if (!isLoggedIn || !token) {
//       navigate("/login");
//       return;
//     }

//     if (role !== "Instructor") {
//       setError("Bạn không có quyền truy cập trang này.");
//       setTimeout(() => navigate("/instructor/courses"), 2000);
//       return;
//     }
//   }, [navigate]);

//   const pageSize = 10;
//   const [currentPage, setCurrentPage] = useState(1);
//   const totalPages = useMemo(
//     () => Math.max(1, Math.ceil(modules.length / pageSize)),
//     [modules]
//   );
//   const paginatedModules = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return modules.slice(start, start + pageSize);
//   }, [modules, currentPage]);

//   const fetchModules = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       console.log("Fetching modules for courseId:", numericCourseId);
      
//       const apiUrl = `https://localhost:5000/api/manager/course/${numericCourseId}/modules`; // Fixed URL with slash
//       console.log("API URL:", apiUrl);
      
//       const { data } = await axios.get(apiUrl, {
//         headers: getAuthHeaders(),
//       });
//       console.log("API Response:", data);
//       console.log("Data type:", typeof data);
//       console.log("Data length:", data?.length);
//       console.log("First item:", data?.[0]);
      
//       if (!Array.isArray(data)) {
//         console.error("API response is not an array:", data);
//         setModules([]);
//         setCurrentPage(1);
//         return;
//       }
      
//       const valid = data.filter((m) => {
//         console.log("Checking module:", m);
//         const hasValidId = m && (m.moduleId || m.id || m.Id);
//         const hasValidName = m && (m.moduleName || m.ModuleName);
//         console.log("Module validation:", { hasValidId, hasValidName, m });
//         return hasValidId && hasValidName;
//       });
      
//       console.log("Valid modules:", valid);
//       if (valid.length === 0) {
//         setError("Không có module nào cho khóa học này.");
//       }
//       setModules(valid);
//       setCurrentPage(1);
//     } catch (err) {
//       console.error("Error fetching modules:", err.response || err);
      
//       if (err.response?.status === 404) {
//         console.log("404 - Course not found or no modules exist");
//         setModules([]);
//         setCurrentPage(1);
//         setError(err.response?.data || "Không tồn tại khóa học này hoặc không có module.");
//       } else if (err.response?.status === 401) {
//         console.log("401 - Unauthorized, redirecting to login");
//         navigate("/login");
//         return;
//       } else if (err.response?.status === 403) {
//         console.log("403 - Forbidden, insufficient permissions");
//         setError("Bạn không có quyền truy cập khóa học này.");
//       } else {
//         console.log("Other error:", err.response?.status, err.message);
//         setError(`Lỗi ${err.response?.status || 'không xác định'}: ${err.response?.data?.message || err.message || "Không thể tải module"}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchModules();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [numericCourseId, navigate]);

//   const toggleStatus = async (id, status) => {
//     if (processing) return;
//     setProcessing(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       await axios.put(
//         `https://localhost:5000/api/manager/ManageModule/update-status/${id}?status=${!status}`,
//         {},
//         {
//           headers: getAuthHeaders(),
//         }
//       );
//       await fetchModules();
//       setSuccessMessage("Đã cập nhật trạng thái!");
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (err) {
//       if (err.response?.status === 401) {
//         navigate("/login");
//         return;
//       }
//       alert(err.response?.data?.message || err.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleAddChange = (e) => {
//     const { name, value } = e.target;
//     setNewModule((prev) => ({ ...prev, [name]: value }));
//   };

//   const submitAdd = async (e) => {
//     e.preventDefault();
    
//     if (!newModule.moduleName?.trim()) {
//       alert("Vui lòng nhập tên module");
//       return;
//     }
    
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       console.log("Adding module:", newModule);
//       console.log("Course ID:", numericCourseId);
      
//       const apiUrl = `https://localhost:5000/api/manager/course/${numericCourseId}/add-module`; // Fixed URL with slash
//       console.log("Add module API URL:", apiUrl);

//       await axios.post(apiUrl, newModule, {
//         headers: getAuthHeaders(),
//       });
      
//       console.log("Module added successfully, fetching updated list...");
//       await fetchModules();
//       setShowAddModal(false);
//       setNewModule({ moduleName: "", description: "" });
//       setSuccessMessage("Thêm module thành công!");
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (err) {
//       console.error("Error adding module:", err.response || err);
//       if (err.response?.status === 401) {
//         navigate("/login");
//         return;
//       }
//       const errorMessage = err.response?.data?.message || err.message || "Không thể thêm module";
//       alert(`Lỗi thêm module: ${errorMessage}`);
//     }
//   };

//   return (
//     <>
//       <Header />
//       <main className="course-list-container">
//         <div className="course-list-header">
//           <h2>Danh sách Module</h2>
//           <button className="add-btn" onClick={() => setShowAddModal(true)}>
//             Thêm module
//           </button>
//         </div>

//         {successMessage && <div className="success-message-fixed">{successMessage}</div>}

//         {loading ? (
//           <p>Đang tải dữ liệu...</p>
//         ) : error ? (
//           <div className="error-message">{error}</div>
//         ) : modules.length === 0 ? (
//           <div className="empty-module">
//             <h2>Chưa có module nào</h2>
//             <p>Khóa học này hiện chưa có module nào được thêm.</p>
//             <button className="add-btn" onClick={() => setShowAddModal(true)}>
//               Thêm module đầu tiên
//             </button>
//           </div>
//         ) : (
//           <div className="table-wrapper">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Tên module</th>
//                   <th>Mô tả</th>
//                   <th>Trạng thái</th>
//                   <th>Ngày tạo</th>
//                   <th>Ngày chỉnh sửa</th>
//                   <th>Hành động</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedModules.map((m) => {
//                   const moduleId = m.moduleId || m.id || m.Id;
//                   const moduleName = m.moduleName || m.ModuleName;
//                   const description = m.description || m.Description;
//                   const status = m.status !== undefined ? m.status : m.Status;
//                   const createdDate = m.createdDate || m.CreatedDate;
//                   const updatedDate = m.updatedDate || m.UpdatedDate;
                  
//                   return (
//                     <tr key={moduleId}>
//                       <td>{moduleName}</td>
//                       <td>{description || "Chưa có mô tả"}</td>
//                       <td className={status ? "status-active" : "status-inactive"}>
//                         {status ? "Hoạt động" : "Không hoạt động"}
//                       </td>
//                       <td>{new Date(createdDate).toLocaleDateString("vi-VN")}</td>
//                       <td>
//                         {updatedDate
//                           ? new Date(updatedDate).toLocaleDateString("vi-VN")
//                           : "Chưa cập nhật"}
//                       </td>
//                       <td>
//                         <button
//                           className="action-btn update-btn"
//                           onClick={() => {
//                             setEditingModule({ ...m, moduleId, moduleName, description });
//                             setEditForm({ moduleName: moduleName, description: description || "" });
//                           }}
//                         >
//                           ✏️
//                         </button>
//                         <button
//                           className="action-btn toggle-status-btn"
//                           onClick={() => setConfirmToggle({ open: true, module: { ...m, moduleId, moduleName, status } })}
//                         >
//                           {status ? "🔒" : "🔓"}
//                         </button>
//                          <Link to={`/quizzes/${moduleId}`}>
//                           <button className="action-btn quizzes-btn">
//                             ❓
//                           </button>
//                         </Link>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>

//             <div className="pagination">
//               <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
//                 Trước
//               </button>
//               <span>
//                 Trang {currentPage} / {totalPages}
//               </span>
//               <button
//                 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={currentPage === totalPages}
//               >
//                 Sau
//               </button>
//             </div>
//           </div>
//         )}

//         {confirmToggle.open && confirmToggle.module && (
//           <div className="confirm-modal">
//             <div className="modal-box">
//               <h3>Xác nhận thay đổi trạng thái</h3>
//               <p>
//                 Bạn có chắc muốn {(confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status) ? "ẩn" : "hiện"} module "
//                 {confirmToggle.module.moduleName || confirmToggle.module.ModuleName}"?
//               </p>
//               <div className="modal-actions">
//                 <button className="cancel-btn" onClick={() => setConfirmToggle({ open: false, module: null })}>
//                   Hủy
//                 </button>
//                 <button
//                   className="submit-btn"
//                   onClick={() => {
//                     const moduleId = confirmToggle.module.moduleId || confirmToggle.module.id || confirmToggle.module.Id;
//                     const status = confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status;
//                     toggleStatus(moduleId, status);
//                     setConfirmToggle({ open: false, module: null });
//                   }}
//                 >
//                   {(confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status) ? "Ẩn" : "Hiện"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {editingModule && (
//           <div
//             className="modal-overlay"
//             onClick={(e) => e.target.classList.contains("modal-overlay") && setEditingModule(null)}
//           >
//             <div className="modal-content">
//               <h3>Chỉnh sửa module</h3>
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   const token = localStorage.getItem("token");
//                   if (!token) {
//                     navigate("/login");
//                     return;
//                   }
                  
//                   const moduleId = editingModule.moduleId || editingModule.id || editingModule.Id;
//                   console.log("Updating module with ID:", moduleId);
                  
//                   axios
//                     .put(
//                       `https://localhost:5000/api/manager/ManageModule/module${moduleId}/update`,
//                       editForm,
//                       {
//                         headers: getAuthHeaders(),
//                       }
//                     )
//                     .then(() => {
//                       fetchModules();
//                       setEditingModule(null);
//                       setSuccessMessage("Cập nhật thành công!");
//                       setTimeout(() => setSuccessMessage(""), 3000);
//                     })
//                     .catch((err) => {
//                       if (err.response?.status === 401) {
//                         navigate("/login");
//                         return;
//                       }
//                       alert(err.response?.data?.message || err.message);
//                     });
//                 }}
//               >
//                 <div className="form-group">
//                   <label>Tên module</label>
//                   <input
//                     name="moduleName"
//                     value={editForm.moduleName}
//                     onChange={(e) => setEditForm({ ...editForm, moduleName: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Mô tả</label>
//                   <textarea
//                     name="description"
//                     value={editForm.description}
//                     onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
//                   />
//                 </div>
//                 <div className="modal-actions">
//                   <button type="button" className="cancel-btn" onClick={() => setEditingModule(null)}>
//                     Hủy
//                   </button>
//                   <button type="submit" className="submit-btn">
//                     Lưu
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {showAddModal && (
//           <div
//             className="modal-overlay"
//             onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddModal(false)}
//           >
//             <div className="modal-content">
//               <h3>Thêm module</h3>
//               <form onSubmit={submitAdd}>
//                 <div className="form-group">
//                   <label>Tên module</label>
//                   <input
//                     name="moduleName"
//                     value={newModule.moduleName}
//                     onChange={handleAddChange}
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Mô tả</label>
//                   <textarea
//                     name="description"
//                     value={newModule.description}
//                     onChange={handleAddChange}
//                   />
//                 </div>
//                 <div className="modal-actions">
//                   <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
//                     Hủy
//                   </button>
//                   <button type="submit" className="submit-btn">
//                     Thêm
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </main>
//       <Footer />
//     </>
//   );
// }

// export default ModulePage;