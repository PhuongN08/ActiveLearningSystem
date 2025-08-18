import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/pupil/StudentProgress.css"; 

function ParentProgress() {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const courseStudentId = 1; // Tạm thời gắn cứng, sau này có thể lấy từ useParams

  useEffect(() => {
    axios
      .get(`https://localhost:5000/api/Parent/course-progress/${courseStudentId}`)
      .then((res) => {
        setProgress(res.data);
      })
      .catch((err) => {
        setError("Không thể tải tiến độ học của học sinh.");
      });
  }, [courseStudentId]);

  if (error) {
    return (
      <>
        <Header />
        <main className="progress-container">
          <p className="error-message">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!progress) {
    return (
      <>
        <Header />
        <main className="progress-container">Đang tải tiến độ học...</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="progress-container">
        <h2>Tiến độ học của con bạn</h2>
        <p><strong>Ngày bắt đầu:</strong> {progress.startDate}</p>

        {progress.modules?.map((mod) => (
          <div className="module-block" key={mod.moduleId}>
            <h3>{mod.moduleName}</h3>
            <table>
              <thead>
                <tr>
                  <th>Tên bài học</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mod.lessons?.map((lesson) => (
                  <tr key={lesson.lessonId}>
                    <td>{lesson.lessonName}</td>
                    <td className={lesson.isCompleted ? "status-complete" : "status-incomplete"}>
                      {lesson.isCompleted ? "✅ Đã hoàn thành" : "⏳ Chưa hoàn thành"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}

export default ParentProgress;
