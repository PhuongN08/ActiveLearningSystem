// VerifyOtp.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/VerifyOtp.css";

export default function VerifyOtp() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("register_token");
    const savedEmail = localStorage.getItem("register_email");

    if (!savedToken || !savedEmail) {
      setErrorMessage("Thiếu thông tin xác thực. Vui lòng đăng ký lại.");
    } else {
      setToken(savedToken);
      setEmail(savedEmail);
    }
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP!");
      return;
    }

    if (!token) {
      setErrorMessage("Không tìm thấy mã token. Vui lòng đăng ký lại.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        token: token,
        otp: otp
      };

      console.log("Xác thực OTP với:", payload); // ✅ Debug nếu cần

      const res = await axios.post("https://localhost:5000/api/Account/verify-otp", payload);

      setSuccessMessage("✅ Xác thực thành công! Đang chuyển hướng...");

      // Xoá token/email sau xác thực thành công
      localStorage.removeItem("register_token");
      localStorage.removeItem("register_email");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("❌ Lỗi xác thực OTP:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        "Xác thực thất bại. Vui lòng kiểm tra mã OTP!";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={favicon} alt="Logo" className="login-logo" />
      </div>

      <div className="login-right">
        <h2 className="login-title">
          <span className="highlight">Xác&nbsp;Thực&nbsp;OTP</span>
        </h2>
        <p className="login-subtext">
          Nhập mã OTP đã gửi tới email: <b>{email}</b>
        </p>

        {errorMessage && <div className="message-wrapper error-message">{errorMessage}</div>}
        {successMessage && <div className="message-wrapper success-message">{successMessage}</div>}

        <form onSubmit={handleVerify} className="register-form">
          <input
            type="text"
            className="login-input"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác thực"}
          </button>
        </form>
      </div>
    </div>
  );
}
