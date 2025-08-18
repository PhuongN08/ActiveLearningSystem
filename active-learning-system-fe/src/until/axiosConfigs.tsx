import axios, {
  type InternalAxiosRequestConfig,
} from "axios";
import store from "../store/store";

const API_BASE_URL = import.meta.env.VITE_BE_URL as string;

const http = axios.create({
  baseURL: API_BASE_URL,
  // timeout: 10000,
  withCredentials: true, // Gửi cookie HTTP-Only
});

// ✅ Request interceptor: thêm token vào headers
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = store.getState().auth;

    // if (accessToken) {
    //   config.headers.Authorization = `Bearer ${accessToken}`;

    // }
    config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3VzZXJkYXRhIjoie1wiSWRcIjpcIjY4ZmFhMGI1LTJlNmItNDc5Mi04Y2ViLThhNWU5NTFhM2UxZFwiLFwiQ2l0aXplbklkZW50aWZpY2F0aW9uXCI6XCIxMjM0NTY3ODkwMTJcIixcIk5hbWVcIjpcIk5ndXllbiBWYW4gQVwiLFwiQmlydGhEYXlcIjpcIjE5OTAtMDUtMTVUMDA6MDA6MDBcIixcIk5hdGlvbmFsaXR5XCI6XCJWaWV0bmFtXCIsXCJHZW5kZXJcIjp0cnVlLFwiVmFsaWREYXRlXCI6XCIyMDMwLTA1LTE1VDAwOjAwOjAwXCIsXCJPcmlnaW5Mb2NhdGlvblwiOlwiSGFub2lcIixcIlJlY2VudExvY2F0aW9uXCI6XCJIbyBDaGkgTWluaCBDaXR5XCIsXCJJc3N1ZURhdGVcIjpcIjIwMjAtMDUtMTVUMDA6MDA6MDBcIixcIklzc3VlQnlcIjpcIk1pbmlzdHJ5IG9mIFB1YmxpYyBTZWN1cml0eVwiLFwiQ3JlYXRlZEF0XCI6XCIyMDI1LTA2LTA5VDIxOjQ1OjQ4LjdcIixcIkNyZWF0ZWRCeVwiOlwiZGJiOTNkMjMtNmE5Yy00OTg1LWFkOWYtYjc0YjlhODc0N2E5XCIsXCJVcGRhdGVkQXRcIjpcIjIwMjUtMDYtMDlUMjE6NDU6NDguN1wiLFwiVXBkYXRlZEJ5XCI6XCJlZWYxMzM4OC00MjczLTQwNzYtYWQ0YS0xNGRkNTYzOTI5MTVcIn0iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbiIsImV4cCI6MTc0OTgzMDkzNywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzIxOS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MjE5In0.5QGVLKf8kUgTgSJk6VerMrPVA19G09PnBhj_cXbcPic`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default http;
