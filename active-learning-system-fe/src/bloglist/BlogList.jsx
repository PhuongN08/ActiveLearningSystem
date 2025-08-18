import React, { useEffect, useState } from "react";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/blog/bloglist.css";
import { getAllBlogs } from "../js/blogApi";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const navigate = useNavigate();

  const pageSize = 8;

  useEffect(() => {
    getAllBlogs(page, pageSize).then(({ blogs, hasNextPage }) => {
      console.log("🔍 Blog list data:", blogs); // ✅ Kiểm tra dữ liệu trả về
      setBlogs(blogs);
      setHasNextPage(hasNextPage);
    });
  }, [page]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Pupil", "Parent"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="bloglist-container"> {/* Sửa thành bloglist-container */}
        <h2>📚 Bài viết mới</h2>

        <div className="blog-grid">
          {blogs.map((blog, index) => {
            const blogId = blog.blogId || blog.id || blog._id; // ✅ Ưu tiên theo tên đúng

            if (!blogId) {
              console.warn(`⚠️ Bài viết tại index ${index} không có ID hợp lệ`, blog);
              return null;
            }

            return (
              <div key={blogId} className="blog-card">
                <img src={blog.thumbnail} alt={blog.title} />
                <div className="card-content">
                  <div className="meta">
                    <span>
                      <FaRegCalendarAlt style={{ marginRight: "6px", color: "#888" }} />
                      {blog.createdDate}
                    </span>
                    <span>{blog.author}</span>
                  </div>

                  {/* ✅ Tiêu đề có thể click */}
                  <h3
                    className="blog-title-link"
                    onClick={() => navigate(`/blog/${blogId}`)}
                    style={{ cursor: "pointer", color: "#007bff" }}
                  >
                    {blog.title}
                  </h3>

                  <p>{blog.summary}</p>

                  <div className="card-footer">
                    {/* ✅ Chỉ phần READ MORE có thể click */}
                    <span
                      className="read-more-link"
                      onClick={() => navigate(`/blog/${blogId}`)}
                      style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}
                    >
                      READ MORE
                    </span>
                    <span>💬 {blog.commentCount || 0} Comment</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Trang trước
          </button>
          <span>Trang {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={!hasNextPage}>
            Trang sau
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogList;