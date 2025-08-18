import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchQuizzesByModuleId,
  fetchQuizById,
  createQuiz,
  updateQuiz,
  updateQuizTopics,
  lockUnlockQuiz,
  fetchTopicDropdown,
} from "../js/manager/quizApi";
import Instructor from "../Component/InstructorSidebar";
import "../css/manager/quizzmanager.css";

const ManagerQuizList = () => {
  const { moduleId } = useParams();
  const numericModuleId = parseInt(moduleId, 10);
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, quizId: null, status: false });
  const [createForm, setCreateForm] = useState({
    moduleId: numericModuleId,
    title: "",
    description: "",
    timeLimit: "",
    questionCount: "",
    requiredScore: "",
    status: "false",
  });
  const [editForm, setEditForm] = useState({});
  const [newTopicIds, setNewTopicIds] = useState([]);
  const [editTopicQuizId, setEditTopicQuizId] = useState(null);
  const [topicUpdateError, setTopicUpdateError] = useState(""); // Add this state

  // Handle user avatar in localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      if (user?.avatar) {
        const fixedAvatar = user.avatar.startsWith("https")
          ? user.avatar
          : `https://localhost:5000/${user.avatar.startsWith("/") ? user.avatar.slice(1) : user.avatar}`;
        localStorage.setItem("avatar", fixedAvatar);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      setErrorMessage("Lỗi khi tải thông tin người dùng.");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Instructor"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  // Load quizzes
  useEffect(() => {
    const loadQuizzes = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Bạn cần đăng nhập để xem danh sách quiz.");
          navigate('/login', { replace: true });
          return;
        }
        if (!numericModuleId) throw new Error("Module ID không hợp lệ.");
        const quizzes = await fetchQuizzesByModuleId(numericModuleId);
        setQuizzes(quizzes);
        if (quizzes.length > 0) {
          const firstQuiz = await fetchQuizById(quizzes[0].id);
          if (firstQuiz.moduleName) {
            setModuleName(firstQuiz.moduleName);
          }
        }
        setErrorMessage("");
      } catch (error) {
        console.error("Error loading quizzes:", error);
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuizzes();
  }, [numericModuleId, navigate]);

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      if (!selectedQuiz) return;

      try {
        setLoadingTopics(true);
        const topicsData = await fetchTopicDropdown(selectedQuiz.id);
        setTopics(topicsData);
        setErrorMessage("");
      } catch (error) {
        console.error("Error loading topics:", error);
        setErrorMessage(error.message);
      } finally {
        setLoadingTopics(false);
      }
    };
    loadTopics();
  }, [selectedQuiz]);

  // Handle quiz selection
  const handleSelectQuiz = useCallback(async (quizId) => {
    try {
      const quiz = await fetchQuizById(quizId);
      setSelectedQuiz(quiz);
      // Set module name from the selected quiz's moduleName
      if (quiz.moduleName) {
        setModuleName(quiz.moduleName);
      }
      const topics = await fetchTopicDropdown(quizId);
      setTopics(topics);
      const currentTopicIds = quiz.topics ? quiz.topics.map((t) => t.id) : [];
      setNewTopicIds(currentTopicIds);
      setErrorMessage("");
    } catch (error) {
      console.error("Error selecting quiz:", error);
      setErrorMessage(error.message);
    }
  }, []);

  // Select first quiz when quizzes list changes
  useEffect(() => {
    if (quizzes.length > 0 && (!selectedQuiz || !quizzes.some((q) => q.id === selectedQuiz.id))) {
      handleSelectQuiz(quizzes[0].id);
    } else if (quizzes.length === 0) {
      setSelectedQuiz(null);
    }
  }, [quizzes, selectedQuiz, handleSelectQuiz]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        moduleId: createForm.moduleId,
        title: createForm.title,
        description: createForm.description,
        timeLimit: parseInt(createForm.timeLimit),
        questionCount: parseInt(createForm.questionCount),
        requiredScore: parseInt(createForm.requiredScore),
        status: createForm.status === "true",
      };

      await createQuiz(formData);
      setSuccessMessage("Tạo quiz thành công!");
      setIsCreateModalOpen(false);
      setCreateForm({
        moduleId: numericModuleId,
        title: "",
        description: "",
        timeLimit: "",
        questionCount: "",
        requiredScore: "",
        status: "false",
      });
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error creating quiz:", error);
      setErrorMessage(error.message);
    }
  };

  const handleEditQuiz = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...editForm,
        moduleId: numericModuleId,
        timeLimit: parseInt(editForm.timeLimit),
        questionCount: parseInt(editForm.questionCount),
        requiredScore: parseInt(editForm.requiredScore),
        status: editForm.status === "true",
      };

      await updateQuiz(editForm.id, formData);
      setSuccessMessage("Cập nhật quiz thành công!");
      setIsEditModalOpen(false);
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      setSelectedQuiz({ ...selectedQuiz, ...formData });
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating quiz:", error);
      setErrorMessage(error.message);
    }
  };

  // Update handleUpdateTopics function
  const handleUpdateTopics = async (quizzId) => {
    try {
      setTopicUpdateError(""); // Clear previous errors
      await updateQuizTopics(quizzId, newTopicIds);
      const updatedQuiz = await fetchQuizById(quizzId);
      setSuccessMessage("Cập nhật topics thành công!");
      setSelectedQuiz(updatedQuiz);
      setIsEditTopicModalOpen(false); // Close topic modal on success
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      // Chỉ hiển thị lỗi thực sự từ backend, nếu không có thì không hiển thị gì
      const msg = error?.response?.data?.message || "";
      setTopicUpdateError(msg);
    }
  };

  const handleLockUnlockQuiz = async (quizId, currentStatus) => {
    setConfirmModal({ show: true, quizId, status: currentStatus });
  };

  const confirmLockUnlock = async () => {
    try {
      const quizId = confirmModal.quizId;
      await lockUnlockQuiz(quizId);
      setSuccessMessage(`Cập nhật trạng thái quiz thành công!`);
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      if (selectedQuiz && selectedQuiz.id === quizId) {
        const updatedQuiz = await fetchQuizById(quizId);
        setSelectedQuiz(updatedQuiz);
      }
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error locking/unlocking quiz:", error);
      setErrorMessage(error.message);
    } finally {
      setConfirmModal({ show: false, quizId: null, status: false });
    }
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm({ ...createForm, [name]: value });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Add date formatting helper
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return "Không có ngày";
    }
  };

  // Update the header in render section
  return (
    <div style={{ display: 'flex', height: '104vh', width: '97vw', overflow: 'hidden' }}>
      <Instructor />
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div className="app-container-quiz">

          <main className="quiz-manager-container-quiz">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: '#f3f4f6',
                  color: '#2563eb',
                  border: '1.5px solid #2563eb',
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  marginRight: 8
                }}
              >
                ← Quay lại
              </button>
              <h2 style={{ margin: 0 }}>Danh sách bài Quiz của {moduleName || "Đang tải..."}</h2>
            </div>
            {successMessage && <p className="success-message-quiz">{successMessage}</p>}
            {errorMessage && <p className="error-message-quiz">{errorMessage}</p>}
            {isLoading && <p>Đang tải dữ liệu...</p>}
            <div className="quiz-manager-header">
              <button className="edit-btn-quiz" onClick={() => setIsCreateModalOpen(true)}>
                Tạo Quiz Mới
              </button>
            </div>
            <div className="quiz-content-container">
              <div className="quiz-list-grid">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={`quiz-card ${selectedQuiz?.id === quiz.id ? "selected-quiz" : ""}`}
                    onClick={() => handleSelectQuiz(quiz.id)}
                  >
                    <h4>{quiz.title}</h4>
                    <p><strong>Mô tả:</strong> {quiz.description || "Chưa có mô tả"}</p>
                    <p><strong>Số câu:</strong> {quiz.questionCount}</p>
                    <p><strong>Thời gian:</strong> {quiz.timeLimit} phút</p>
                    <p><strong>Ngày tạo:</strong> {formatDate(quiz.createAt)}</p>
                    <p><strong>Điểm qua:</strong> {quiz.requiredScore}</p>
                    <p><strong>Trạng thái:</strong> {quiz.status ? "Hoạt động" : "Không hoạt động"}</p>
                    <div className="quiz-card-actions">
                      <button
                        className="edit-btn-quiz"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditForm(quiz);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Sửa Quiz
                      </button>
                      <button
                        className="edit-btn-quiz"
                        style={{ backgroundColor: '#fbbf24', color: '#fff' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTopicQuizId(quiz.id);
                          setNewTopicIds(quiz.topics ? quiz.topics.map((t) => t.id) : []);
                          setIsEditTopicModalOpen(true);
                        }}
                      >
                        Sửa Topic
                      </button>
                      <button
                        className="lock-unlock-btn-quiz"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLockUnlockQuiz(quiz.id, quiz.status);
                        }}
                      >
                        {quiz.status ? "Khóa" : "Mở khóa"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="topic-list-section">
                <h3>Topics của {selectedQuiz ? `Quiz: ${selectedQuiz.title}` : "Chưa chọn Quiz"}</h3>
                {selectedQuiz ? (
                  loadingTopics ? (
                    <p>Đang tải topics...</p>
                  ) : (
                    <div className="topic-display">
                      {selectedQuiz.topics && selectedQuiz.topics.length > 0 ? (
                        <ul>
                          {selectedQuiz.topics.map((topic, index) => (
                            <li key={index}>{topic.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Không có topic nào cho quiz này.</p>
                      )}
                    </div>
                  )
                ) : (
                  <p>Vui lòng chọn một quiz để xem topics.</p>
                )}
              </div>
            </div>
          </main>
        </div>
        {/* Modals and Confirm Modal inside the right panel */}
        {isCreateModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsCreateModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Tạo Quiz Mới</h3>
              <form className="form-container-quiz" onSubmit={handleCreateQuiz}>
                <div>
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    name="title"
                    value={createForm.title}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Mô tả:</label>
                  <input
                    type="text"
                    name="description"
                    value={createForm.description}
                    onChange={handleCreateFormChange}
                  />
                </div>
                <div>
                  <label>Thời gian (phút):</label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={createForm.timeLimit}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Số câu hỏi:</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={createForm.questionCount}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Điểm qua:</label>
                  <input
                    type="number"
                    name="requiredScore"
                    value={createForm.requiredScore}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>
              
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz">Tạo</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isEditModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsEditModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Sửa Quiz</h3>
              <form className="form-container-quiz" onSubmit={handleEditQuiz}>
                <div>
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    name="title"
                    value={editForm.title || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Mô tả:</label>
                  <input
                    type="text"
                    name="description"
                    value={editForm.description || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <label>Thời gian (phút):</label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={editForm.timeLimit || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Số câu hỏi:</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={editForm.questionCount || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Điểm qua:</label>
                  <input
                    type="number"
                    name="requiredScore"
                    value={editForm.requiredScore || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <label>Trạng thái:</label>
                  <select
                    name="status"
                    value={editForm.status ? "true" : "false"}
                    onChange={handleEditFormChange}
                    className="status-select"
                    required
                  >
                    <option value="false">Không hoạt động</option>
                    <option value="true">Hoạt động</option>
                  </select>
                </div>
                {/* Hiển thị lỗi edit ngay trong modal */}
                {errorMessage && (
                  <p className="error-message-quiz" style={{ marginTop: 8 }}>{errorMessage}</p>
                )}
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz">Lưu</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Topic Modal */}
        {isEditTopicModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsEditTopicModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Sửa Topic Quiz</h3>
              <form className="form-container-quiz" onSubmit={e => { e.preventDefault(); handleUpdateTopics(editTopicQuizId); }}>
                <div>
                  <label>Topics:</label>
                  <select
                    multiple
                    value={newTopicIds}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setNewTopicIds(selectedOptions);
                    }}
                    className="status-select"
                    style={{ height: "150px", width: "100%" }}
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name} - {topic.className} - {topic.categoryName}
                      </option>
                    ))}
                  </select>
                  <small>Giữ Ctrl để chọn nhiều topics</small>
                  {topicUpdateError && <p className="error-message-quiz">{topicUpdateError}</p>}
                </div>
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz" disabled={!editTopicQuizId}>Cập nhật Topics</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsEditTopicModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Confirm Modal */}
        {confirmModal.show && (
          <div className="modal-overlay-quiz" onClick={() => setConfirmModal({ show: false, quizId: null, status: false })}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận</h3>
              <p>Bạn có chắc muốn {confirmModal.status ? "khóa" : "mở khóa"} quiz này không?</p>
              <div className="form-buttons-quiz">
                <button className="edit-btn-quiz" onClick={confirmLockUnlock}>
                  Xác nhận
                </button>
                <button
                  className="delete-btn-quiz"
                  onClick={() => setConfirmModal({ show: false, quizId: null, status: false })}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerQuizList;