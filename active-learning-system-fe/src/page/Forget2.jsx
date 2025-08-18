import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/Forget2.css";

export default function Forget2() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Lấy token từ URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccess(false);

    if (!token) {
      setErrorMessage("Không tìm thấy token. Vui lòng kiểm tra lại email.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu không trùng khớp!");
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:5000/api/Account/reset-password",
        {
          token: token,
          newPassword: password,
        }
      );

      if (response.status === 200) {
        setSuccess(true);
      } else {
        setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      if (err.response?.data) {
        setErrorMessage("Lỗi: " + err.response.data);
      } else {
        setErrorMessage("Đã xảy ra lỗi khi kết nối.");
      }
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-left">
        <img src={favicon} alt="Logo" className="reset-logo" />
      </div>

      <div className="reset-right">
        <h2 className="reset-title">
          <span className="highlight">Đặt&nbsp;Lại&nbsp;Mật&nbsp;Khẩu</span>
        </h2>

        <p className="reset-subtext">
          Quay về{" "}
          <span className="create-link" onClick={() => navigate("/login")}>
            Đăng nhập
          </span>
        </p>

        {errorMessage && (
          <div className="message-wrapper error-message">
            {errorMessage}
          </div>
        )}

        {success ? (
          <>
            <p className="success-text">
              ✅ Mật khẩu đã được cập nhật thành công!
            </p>
            <button
              className="reset-button"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              className="reset-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              className="reset-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className="reset-button">
              Cập nhật
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
