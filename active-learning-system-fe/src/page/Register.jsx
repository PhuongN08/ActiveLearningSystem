// Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    dob: "",
    sex: 0,
    phone: "",
    email: "",
    roleId: 6,
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
    ...prev,
    [name]: name === "sex" ? Number(value) : value
  }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!form.username || !form.password || !form.email) {
      setErrorMessage("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://localhost:5000/api/Account/pre-register",
        form
      );

      const { token } = res.data;

      // ✅ Lưu token và email vào localStorage
      localStorage.setItem("register_token", token);
      localStorage.setItem("register_email", form.email);

      navigate("/verify-otp");
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        "Đăng ký thất bại, vui lòng thử lại!";
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
          <span className="highlight">Tạo&nbsp;Tài&nbsp;Khoản&nbsp;Mới</span>
        </h2>
        <p className="login-subtext">
          Đã có tài khoản?{" "}
          <span className="create-link" onClick={() => navigate("/login")}>
            Đăng nhập
          </span>
        </p>

        {errorMessage && (
          <div className="error-wrapper">
            <p className="error-message">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <input name="name" value={form.name} onChange={handleChange} className="login-input" placeholder="Họ và tên" required />
          <input name="address" value={form.address} onChange={handleChange} className="login-input" placeholder="Địa chỉ" />
          <input type="date" name="dob" value={form.dob} onChange={handleChange} className="login-input" required />
          <select name="sex" value={form.sex} onChange={handleChange} className="login-input">
            <option value={1}>Nam</option>
            <option value={0}>Nữ</option>
          </select>
          <input name="phone" value={form.phone} onChange={handleChange} className="login-input" placeholder="Số điện thoại" />
          <input type="email" name="email" value={form.email} onChange={handleChange} className="login-input" placeholder="Email" required />
          <select name="roleId" value={form.roleId} onChange={handleChange} className="login-input">
            <option value={6}>Học sinh</option>
            <option value={7}>Phụ huynh</option>
          </select>
          <input name="username" value={form.username} onChange={handleChange} className="login-input" placeholder="Tên đăng nhập" required />
          <input type="password" name="password" value={form.password} onChange={handleChange} className="login-input" placeholder="Mật khẩu" required />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Đang gửi OTP..." : "Đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
