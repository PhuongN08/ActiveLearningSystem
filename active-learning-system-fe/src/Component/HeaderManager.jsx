import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../css/icon/favicon11.png";
import menuIcon from "../css/icon/menu-white.png";
import bookmarkIcon from "../css/icon/bookmark.png";
import "../css/manager/HeaderManager.css";

const HeaderManager = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("https://localhost:5000/profile/default.jpg");
  const navigate = useNavigate();

  useEffect(() => {
    const updateAuthState = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setIsLoggedIn(loggedIn);
      setUsername(localStorage.getItem("username") || "");
      const userAvatar = user?.avatar;
      const normalizedAvatar = userAvatar?.startsWith("https")
        ? userAvatar
        : `https://localhost:5000/${userAvatar?.startsWith("/") ? userAvatar.slice(1) : userAvatar}`;
      setAvatar(normalizedAvatar || "https://localhost:5000/profile/default.jpg");
    };

    updateAuthState();
    const handleStorageChange = () => updateAuthState();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setAvatar("https://localhost:5000/profile/default.jpg");
    localStorage.clear();
    navigate("/homepage");
  };

  return (
    <header className="header-manager">
      <button className="header-manager-burger-btn" onClick={() => setDrawerOpen(true)}>
        <img src={menuIcon} alt="menu" />
      </button>

      <aside className={`header-manager-drawer ${drawerOpen ? "header-manager-open" : ""}`}>
        <div className="header-manager-drawer-top">
          <img src={logo} alt="logo" className="header-manager-drawer-logo" />
          <button className="header-manager-close-btn" onClick={() => setDrawerOpen(false)}>
            ←
          </button>
        </div>
        <nav className="header-manager-drawer-menu">
          <Link to="/managercourselist" onClick={() => setDrawerOpen(false)}>
            <img src={bookmarkIcon} alt="" />
            <span>Quản lý khóa học</span>
          </Link>
          <Link to="/managerquizlist" onClick={() => setDrawerOpen(false)}>
            <img src={bookmarkIcon} alt="" />
            <span>Quản lý bài quiz</span>
          </Link>
          <Link to="/managerreport" onClick={() => setDrawerOpen(false)}>
            <img src={bookmarkIcon} alt="" />
            <span>Quản lý báo cáo</span>
          </Link>
        </nav>
      </aside>

      <Link to="/homepage" className="header-manager-logo">
        <img src={logo} alt="Manager Logo" />
      </Link>

      <div className="header-manager-navbar11">
        <Link to="/homepage">Trang chủ</Link>
        <Link to="/managercourselist">Quản lý khóa học</Link>
        <Link to="/managerquizlist">Quản lý bài quiz</Link>
        <Link to="/managerReport">Quản lý báo cáo</Link>
      </div>

      <div className="header-manager-auth-buttons">
        {!isLoggedIn ? (
          <>
            <Link to="/login">
              <button>👤 Đăng nhập</button>
            </Link>
            <Link to="/register">
              <button>🧑‍💼 Đăng ký</button>
            </Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: "12px" }}>
              👋 Xin chào, Quản lý {username}
            </span>
            <Link to="/profile" title="Hồ sơ quản lý">
              <img
                src={avatar}
                alt="Manager Profile"
                style={{
                  width: "28px",
                  height: "28px",
                  marginRight: "12px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onError={(e) => (e.target.src = "https://localhost:5000/profile/default.jpg")}
              />
            </Link>
            <button onClick={handleLogout}>Đăng xuất</button>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderManager;