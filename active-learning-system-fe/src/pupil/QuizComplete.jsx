import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/pupil/quizComplete.css';

const QuizComplete = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { studentCourseId, moduleId, userQuizzId } = location.state || {};

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentCourseId || !moduleId || !userQuizzId) {
            setLoading(false);
            setQuestions([]);
            return;
        }
        const fetchQuizDetail = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                // Tìm module và quiz theo userQuizzId
                const module = res.data.moduleCompletionVMs.find(m => m.id === moduleId);
                const quiz = module?.quizzs?.find(q => q.userQuizzId === userQuizzId);
                setQuestions(quiz?.questions || []);
            } catch (err) {
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizDetail();
    }, [studentCourseId, moduleId, userQuizzId]);

    if (loading) return <div>Đang tải chi tiết bài làm...</div>;
    if (!questions.length) return <div>Không có dữ liệu câu hỏi hoặc thiếu tham số.</div>;

    return (
        <div className="quiz-complete-container">
            <button
                className="back-btn"
                style={{
                    marginBottom: '24px',
                    padding: '8px 18px',
                    background: '#f4f6fb',
                    color: '#34495e',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
                onClick={() => navigate(-1)}
            >
                ← Quay lại
            </button>
            {questions.map((q, idx) => (
                <div key={q.id} className="quiz-question-block">
                    <div className="quiz-question-title">
                        Câu {idx + 1}: {q.questionContent}
                    </div>
                    <div className="quiz-answers-list">
                        {q.answers.map(ans => {
                            let answerClass = 'quiz-answer';
                            // Nếu người dùng chọn đúng đáp án
                            if (ans.isSelected && ans.isCorrect) answerClass += ' correct-selected';
                            // Nếu người dùng chọn sai đáp án
                            else if (ans.isSelected && !ans.isCorrect) answerClass += ' wrong-selected';
                            // Nếu là đáp án đúng nhưng không được chọn thì chỉ đổi màu nền
                          

                            return (
                                <div key={ans.id} className={answerClass}>
                                    <span className="quiz-answer-option">{ans.answerContent}</span>
                                    {/* Chỉ hiện (Bạn chọn) nếu người dùng chọn đáp án này */}
                                  
                                    {/* Chỉ hiện (Đáp án đúng) nếu là đáp án đúng và người dùng đã chọn hoặc chưa chọn */}
                                    
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuizComplete;