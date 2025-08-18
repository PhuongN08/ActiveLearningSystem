import React, { useEffect, useState } from "react";
import { getAccountList, updateAccountStatus, createAccount, getValidRoles, getAccountDetails } from "../js/admin/accountlist";
import "../css/admin/accountlist.css";
import logo from "../css/icon/favicon11.png";
import { Link } from "react-router-dom";
import usericon from "../css/icon/usericon.png";
import bookmarkIcon from "../css/icon/bookmark.png";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../js/homepageApi";
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const formatDate = (dateString) => {
  if (!dateString) return "Chưa cập nhật";
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa cập nhật";
  }
};

const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [username, setUsername] = useState("Admin");
  const [avatar] = useState("https://localhost:5000/profile/default.jpg");
  
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    address: "",
    dob: new Date().toISOString().split("T")[0],
    sex: 0,
    phone: "",
    avatar: "",
    roleName: "",
    status: true,
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
   localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("accountId"); // 👈 xoá cả accountId nếu có
    localStorage.removeItem("token"); // 👈 Thêm dòng này để xóa token
    localStorage.removeItem("role"); // 👈 Thêm dòng này để xóa role
    setIsLoggedIn(false);
    navigate("/login");
  };

  // Đưa fetchData ra ngoài để có thể gọi lại sau khi tạo tài khoản
  const fetchData = async () => {
    try {
      // Kiểm tra xem user có phải Admin không
      const userRole = localStorage.getItem("role");
      if (!userRole || userRole !== "Admin") {
        setError("Bạn không có quyền truy cập trang này.");
        setTimeout(() => navigate("/error"), 0);
        return;
      }

      const res = await getAccountList(1, 10000, "", null);
      console.log("API Response:", JSON.stringify(res.accounts, null, 2));
      const validAccounts = (res.accounts || []).filter(
        (acc) => acc && typeof acc.name === "string" && typeof acc.username === "string"
      );
      // Fetch profile data using profileId or accountId
      const detailedAccounts = await Promise.all(
        validAccounts.map(async (acc) => {
          const accountId = acc.id ?? acc.Id ?? 0;
          const profileId = acc.profileId ?? acc.profile_id ?? accountId;
          if (profileId) {
            try {
              const details = await getAccountDetails(profileId);
              return { ...acc, ...details };
            } catch (err) {
              console.error(`Error fetching details for profile ${profileId}:`, err);
              if (accountId && profileId !== accountId) {
                try {
                  const details = await getAccountDetails(accountId);
                  return { ...acc, ...details };
                } catch (err) {
                  console.error(`Error fetching details for account ${accountId}:`, err);
                  return acc;
                }
              }
              return acc;
            }
          }
          return acc;
        })
      );
      setAccounts(detailedAccounts);

      const rolesData = await getValidRoles();
      const normalizedRoles = Array.isArray(rolesData)
        ? rolesData.map((role) => (typeof role === "object" ? role.name : role))
        : [];
      const defaultRoles = normalizedRoles.length > 0 ? normalizedRoles : ["Admin", "User", "Moderator"];
      setRoles(defaultRoles);
      if (defaultRoles.length > 0) {
        setNewAccount((prev) => ({ ...prev, roleName: defaultRoles[0] }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setAccounts([]);
      setRoles(["Admin", "User", "Moderator"]);
    }
  };
  useEffect(() => {
    fetchData();
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedUsername = localStorage.getItem("username") || "";
    const token = localStorage.getItem("token");

    // Kiểm tra authentication
    if (!loggedIn || !token) {
      navigate("/login");
      return;
    }

    setIsLoggedIn(loggedIn);
    setUsername(savedUsername);
    // Avatar luôn là mặc định
  }, [navigate]);

  const filteredAccounts = accounts.filter((acc) => {
    if (!acc || typeof acc.name !== "string" || typeof acc.username !== "string") return false;
    const searchKeyword = searchTerm.trim().toLowerCase();
    return (
      (searchKeyword === "" ||
        acc.name.toLowerCase().includes(searchKeyword) ||
        acc.username.toLowerCase().includes(searchKeyword)) &&
      (roleFilter ? (acc.roleName || acc.role) === roleFilter : true) &&
      (statusFilter !== "" ? acc.status === (statusFilter === "true") : true)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visibleAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  const handleStatusToggle = async (id, currentStatus) => {
    if (!id) return;
    try {
      const newStatus = !currentStatus;
      await updateAccountStatus(id, newStatus);
      setAccounts((prev) =>
        prev.map((acc) =>
          (acc.id ?? acc.Id) === id
            ? { ...acc, status: newStatus, updatedDate: new Date().toISOString().split("T")[0] }
            : acc
        )
      );
    } catch (err) {
      console.error(err);
      setError("Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: name === "sex" ? parseInt(value) : value }));
    setError("");
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Validate các trường bắt buộc
    const requiredFields = ["username", "password", "name", "email", "address", "dob", "sex", "phone", "roleName"];
    const missingFields = requiredFields.filter((field) => !newAccount[field]?.toString().trim());
    if (missingFields.length > 0) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc: " + missingFields.join(", "));
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Username
    if (newAccount.username.length > 50) {
      setError("Tên đăng nhập không được vượt quá 50 ký tự.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Password
    if (newAccount.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(newAccount.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 ký tự in hoa, 1 ký tự in thường, 1 chữ số và 1 ký tự đặc biệt.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Name
    if (newAccount.name.length > 50) {
      setError("Họ tên không được vượt quá 50 ký tự.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Email
    if (!validateEmail(newAccount.email)) {
      setError("Email không đúng định dạng.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Address
    if (newAccount.address.length > 200) {
      setError("Địa chỉ không được vượt quá 200 ký tự.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Dob: phải trước hôm nay và đủ 18 tuổi
    const today = new Date();
    const dob = new Date(newAccount.dob);
    if (isNaN(dob.getTime())) {
      setError("Ngày sinh không hợp lệ.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (dob >= today) {
      setError("Ngày sinh phải trước ngày tạo tài khoản.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      setError("Người dùng phải đủ 18 tuổi trở lên.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Sex
    if (newAccount.sex !== 0 && newAccount.sex !== 1 && newAccount.sex !== "0" && newAccount.sex !== "1") {
      setError("Giới tính không hợp lệ.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // Phone
    if (!/^0\d{9}$/.test(newAccount.phone)) {
      setError("Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (newAccount.phone.length > 200) {
      setError("Số điện thoại không được vượt quá 200 ký tự.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    // RoleName
    if (!roles.includes(newAccount.roleName)) {
      setError("Vai trò không hợp lệ. Chỉ được chọn: " + roles.join(", "));
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      console.log("Sending account data:", newAccount);
      const response = await createAccount(newAccount);
      console.log("Create account response:", response);
      setShowModal(false);
      setNewAccount({
        username: "",
        password: "",
        name: "",
        email: "",
        address: "",
        dob: new Date().toISOString().split("T")[0],
        sex: 0,
        phone: "",
        avatar: "",
        roleName: roles[0] || "",
        status: true,
      });
      setError("");
      // Gọi lại fetchData để reload bảng
      await fetchData();
      setPage(1);
      setSearchTerm("");
      setSearchInput("");
      setRoleFilter("");
    } catch (error) {
      console.error("Error creating account:", error.message);
      setError(error.message || "Không thể tạo tài khoản. Vui lòng thử lại.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim() === "" ? "" : searchInput);

  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleShowDetail = async (acc) => {
    const accountId = acc.id ?? acc.Id ?? 0;
    const profileId = acc.profileId ?? acc.profile_id ?? accountId;
    let detailedAccount = { ...acc };

    if (profileId) {
      try {
        const details = await getAccountDetails(profileId);
        if (details && Object.keys(details).length > 0) {
          detailedAccount = { ...details };
        } else {
          // fallback nếu không có detail
          detailedAccount = { ...acc };
        }
      } catch (err) {
        console.error(`Error fetching details for profile ${profileId}:`, err);
        if (accountId && profileId !== accountId) {
          try {
            const details = await getAccountDetails(accountId);
            if (details && Object.keys(details).length > 0) {
              detailedAccount = { ...acc, ...details };
            } else {
              detailedAccount = { ...acc };
            }
          } catch (err) {
            console.error(`Error fetching details for account ${accountId}:`, err);
            detailedAccount = { ...acc };
          }
        } else {
          detailedAccount = { ...acc };
        }
      }
    }

    // Nếu vẫn không có detail, đảm bảo có object cơ bản
    if (!detailedAccount || Object.keys(detailedAccount).length === 0) {
      detailedAccount = {
        username: acc.username,
        name: acc.name,
        email: acc.email,
        address: acc.address || "",
        dob: acc.dob || "",
        sex: acc.sex || 1,
        phone: acc.phone || "",
        avatar: acc.avatar || "",
        roleName: acc.roleName || acc.role || "",
      };
    }
    setSelectedAccount(detailedAccount);
    setShowDetailModal(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar cố định */}
      <aside style={{
        width: 250,
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0 0 0',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <img src={logo} alt="Logo" style={{ width: 38, height: 38, borderRadius: 8 }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>Admin Panel</h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0 }}>Quản trị hệ thống</p>
          </div>
        </div>
        <nav style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/accountlist" style={{
            background: '#f1f5f9',
            color: '#1e293b',
            padding: '12px 32px',
            textAlign: 'left',
            fontSize: '1rem',
            border: 'none',
            borderRadius: 8,
            marginBottom: 8,
            textDecoration: 'none',
            fontWeight: 500
          }}>
            <img src={bookmarkIcon} alt="" style={{ width: 18, marginRight: 8, verticalAlign: 'middle' }} />
            Danh sách tài khoản
          </Link>
        </nav>
        <div style={{ marginTop: 'auto', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          {isLoggedIn ? (
            <>
              <div title="Hồ sơ quản lý" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'default' }}>
                <img
                  src={avatar}
                  alt="Avatar"
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #3b82f6', boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 16 }}>{username}</span>
                  <span style={{ background: 'linear-gradient(90deg,#22c55e 0%,#3b82f6 100%)', color: '#fff', fontSize: 13, padding: '2px 10px', borderRadius: 8, marginTop: 2 }}>Admin</span>
                </div>
              </div>
              <button onClick={handleLogout} style={{
                background: 'linear-gradient(90deg,#ef4444 0%,#f59e42 100%)',
                color: '#fff',
                border: 'none',
                padding: '9px 28px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: 12,
                fontWeight: 600,
                boxShadow: '0 2px 8px 0 rgba(239,68,68,0.10)',
                transition: 'background 0.2s, box-shadow 0.2s'
              }}>Đăng xuất</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
              <Link to="/login" style={{ width: '80%', marginBottom: 6 }}>
                <button style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Đăng nhập</button>
              </Link>
              <Link to="/register" style={{ width: '80%' }}>
                <button style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Đăng ký</button>
              </Link>
            </div>
          )}
        </div>
      </aside>
      {/* Main content */}
      <div style={{ flex: 1, padding: '40px 48px' }}>
        <div className="account-list-container">
        <div className="account-list-header">
          <h2>Danh sách tài khoản</h2>
          <button className="add-account-btn" onClick={() => setShowModal(true)}>Thêm tài khoản</button>
        </div>
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}>
            <div className="modal-content">
              <h3>Tạo tài khoản mới</h3>
              {error && <p className="error-message">{error}</p>}
              <form onSubmit={handleCreateAccount}>
                <div className="form-group"><label>Tên đăng nhập *</label><input name="username" value={newAccount.username} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Mật khẩu *</label><input name="password" type="password" value={newAccount.password} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Tên người dùng *</label><input name="name" value={newAccount.name} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Email *</label><input name="email" value={newAccount.email} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Địa chỉ</label><input name="address" value={newAccount.address} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Ngày sinh</label><input name="dob" type="date" value={newAccount.dob || ""} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Giới tính</label>
                  <select name="sex" value={newAccount.sex} onChange={handleInputChange}>
                    <option value={0}>Nữ</option>
                    <option value={1}>Nam</option>
                  </select>
                </div>
                <div className="form-group"><label>Số điện thoại</label><input name="phone" value={newAccount.phone} onChange={handleInputChange} /></div>
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select name="roleName" value={newAccount.roleName} onChange={handleInputChange}>
                    {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="submit-btn">Tạo</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showDetailModal && selectedAccount && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowDetailModal(false)}>
            <div className="modal-content">
              <h3>Chi tiết tài khoản: {selectedAccount.name}</h3>
              <div className="detail-group">
                <p><strong>Tên đăng nhập:</strong> {selectedAccount.username}</p>
                <p><strong>Họ tên:</strong> {selectedAccount.name}</p>
                <p><strong>Email:</strong> {selectedAccount.email}</p>
                <p><strong>Địa chỉ:</strong> {selectedAccount.address || "Chưa cập nhật"}</p>
                <p><strong>Ngày sinh:</strong> {formatDate(selectedAccount.dob)}</p>
                <p><strong>Giới tính:</strong> {selectedAccount.sex === 0 || selectedAccount.sex === "0" || selectedAccount.sex === "Nữ" ? "Nữ" : "Nam"}</p>
                <p><strong>Số điện thoại:</strong> {selectedAccount.phone || "Chưa cập nhật"}</p>
                <div className="avatar-section">
                  <p><strong>Avatar:</strong></p>
                  <img
                    src={resolveImageUrl(selectedAccount.avatar || "", "avatar")}
                    alt="Avatar"
                    onError={(e) => (e.target.src = usericon)}
                    className="avatar-image"
                  />
                </div>

              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowDetailModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
        <form className="search-box" style={{ marginBottom: "16px" }} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc tên đăng nhập"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: "8px" }}>Tìm kiếm</button>
        </form>
        <div className="filter-box" style={{ marginBottom: "24px" }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            {roles.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Bị khóa</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Ngày cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleAccounts.map((acc, index) => {
              const accountId = acc.id ?? acc.Id ?? 0;
              return (
                <tr key={accountId || index}>
                  <td>{acc.username}</td>
                  <td
                    style={{ cursor: "pointer", color: "#3b82f6" }}
                    onClick={() => handleShowDetail(acc)}
                  >
                    {acc.name}
                  </td>
                  <td>{acc.email}</td>
                  <td>{acc.roleName || acc.role}</td>
                  <td className={acc.status ? "" : "inactive"}>
                    {acc.status ? "Hoạt động" : "Bị khóa"}
                  </td>
                  <td>{formatDate(acc.createdDate)}</td>
                  <td>{formatDate(acc.updatedDate)}</td>
                  <td>
                    <button onClick={() => handleStatusToggle(accountId, acc.status)}>
                      {acc.status ? "Khóa" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleAccounts.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center" }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              style={{
                padding: "5px 10px",
                background: page === 1 ? "#f0f0f0" : "#3b82f6",
                color: page === 1 ? "#000" : "#fff",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: page === 1 ? "default" : "pointer",
              }}
            >
              Trang đầu
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={page === pageNum}
                style={{
                  padding: "5px 10px",
                  background: page === pageNum ? "#3b82f6" : "#f0f0f0",
                  color: page === pageNum ? "#fff" : "#000",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: page === pageNum ? "default" : "pointer",
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              style={{
                padding: "5px 10px",
                background: page === totalPages ? "#f0f0f0" : "#3b82f6",
                color: page === totalPages ? "#000" : "#fff",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: page === totalPages ? "default" : "pointer",
              }}
            >
              Trang cuối
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AccountList;