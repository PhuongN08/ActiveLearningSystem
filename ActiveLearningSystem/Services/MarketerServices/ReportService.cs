using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public class ReportService : IReportService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly IMailService _mailService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ReportService(AlsContext context, IMapper mapper, IWebHostEnvironment env, IMailService mailService, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _env = env;
            _mailService = mailService;
            _hubContext = hubContext;
        }

        public async Task<bool> CreateReportAsync(CreateReportVM vm, int userId)
        {
            try
            {
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == userId);
                if (profile == null || profile.RoleId != 3) throw new Exception("Người dùng không có quyền tạo báo cáo.");

                var receiver = await _context.Profiles.FirstOrDefaultAsync(p => p.RoleId == 2 && p.Name == vm.ReceiverName);
                if (receiver == null) throw new Exception("Manager không tồn tại.");

                var report = new Report
                {
                    Title = vm.Title,
                    UserId = profile.UserId,
                    ReceiverId = receiver.UserId,
                    ContentDetail = vm.ContentDetail,
                    StatusId = 1,
                    CreatedDate = DateTime.Now,
                    IsDeleted = false
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync();

                var uploadFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "UploadFile");
                var reportFolder = Path.Combine(uploadFolder, $"Report_{report.Id}");
                Directory.CreateDirectory(reportFolder);

                foreach (var file in vm.Files)
                {
                    // ✅ Lưu với Guid__TênGốc
                    var safeFileName = $"{Guid.NewGuid()}__{file.FileName}";
                    var path = Path.Combine(reportFolder, safeFileName);
                    using (var stream = new FileStream(path, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var reportFile = new ReportFile
                    {
                        ReportId = report.Id,
                        FilePath = $"/UploadFile/Report_{report.Id}/{safeFileName}",
                        UploadedAt = DateTime.Now
                    };
                    _context.ReportFiles.Add(reportFile);
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Lỗi tạo báo cáo: " + ex.Message);
                return false;
            }
        }

        public async Task<List<ManagerDropdownVM>> GetAllManagersAsync()
        {
            const int MANAGER_ROLE_ID = 2;
            return await _context.Profiles
                .Where(p => p.RoleId == MANAGER_ROLE_ID)
                .Select(p => new ManagerDropdownVM
                {
                    Id = p.UserId,
                    FullName = p.Name,
                    Email = p.Email
                })
                .ToListAsync();
        }

        public async Task<List<ManagerDropdownVM>> GetAllInstructorsAsync()
        {
            const int INSTRUCTOR_ROLE_ID = 5;
            var instructors = await _context.Profiles
                .Where(p => p.RoleId == INSTRUCTOR_ROLE_ID)
                .Select(p => new ManagerDropdownVM
                {
                    Id = p.UserId,
                    FullName = p.Name,
                    Email = p.Email
                })
                .ToListAsync();
            return instructors;
        }

        public async Task<List<ReportListItemVM>> GetMyReportsAsync(int accountId)
        {
            var profile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return new List<ReportListItemVM>();
            var userId = profile.UserId;
            var role = await _context.Roles
                .Where(r => r.Id == profile.RoleId)
                .Select(r => r.Name)
                .FirstOrDefaultAsync();
            var query = _context.Reports
                .Include(r => r.User)
                .Include(r => r.Instructor)
                .Include(r => r.ReportFiles)
                .Include(r => r.ReportComments)
                .Include(r => r.Status)
                .AsQueryable();
            if (role == "Marketer")
                query = query.Where(r => r.UserId == userId);
            else if (role == "Manager")
                query = query.Where(r => r.ReceiverId == userId);
            else if (role == "Instructor")
                query = query.Where(r => r.InstructorId == userId);
            var reports = await query
                .OrderByDescending(r => r.CreatedDate) // Sắp xếp theo CreatedDate từ mới nhất đến cũ nhất
                .Select(r => new ReportListItemVM
                {
                    Id = r.Id,
                    Title = r.Title,
                    CreatedDate = r.CreatedDate,
                    UserName = r.User.Name,
                    ContentDetail = r.ContentDetail ?? string.Empty,
                    FileCount = r.ReportFiles.Count(),
                    CommentCount = r.ReportComments.Any() ? r.ReportComments.Count() : null,
                    InstructorName = r.Instructor != null ? r.Instructor.Name : null,
                    StatusName = r.Status.Name
                })
                .ToListAsync();
            return reports;
        }

        public async Task<ReportDetailVM> GetReportDetailAsync(int reportId, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .Include(r => r.ReportFiles)
                .Include(r => r.ReportComments)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Role)
                .Include(r => r.Status)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            var role = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync();
            var detail = _mapper.Map<ReportDetailVM>(report);
            detail.AvailableInstructors = await GetAllInstructorsAsync();
            detail.ListStatus = await _context.ReportStatuses.Select(s => new ReportStatusVM { Id = s.Id, Name = s.Name }).ToListAsync();
            detail.CanReject = role == "Manager" && report.StatusId == 1; // summit
            detail.CanApprove = role == "Manager" && report.StatusId == 1;
            detail.CanProcess = role == "Instructor" && report.StatusId == 3; // approve
            detail.CanCreate = role == "Instructor" && report.StatusId == 4; // process
            detail.CanReview = role == "Marketer" && report.StatusId == 6; // created
            detail.CanDone = role == "Marketer" && report.StatusId == 7; // reviewing
            detail.CanPublish = role == "Manager" && report.StatusId == 7; // done
            return detail;
        }

        public async Task<(bool Success, string NewStatusName)> UpdateReportStatusAsync(int reportId, UpdateStatusVM vm, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            var role = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync();
            var isValidTransition = false;
            switch (role)
            {
                case "Marketer":
                    isValidTransition = (report.StatusId == 5 && vm.NewStatusId == 6) || // created -> reviewing
                                        (report.StatusId == 6 && vm.NewStatusId == 7); // reviewing -> done
                    break;
                case "Manager":
                    isValidTransition = (report.StatusId == 1 && vm.NewStatusId == 2) || // summit -> reject
                                        (report.StatusId == 1 && vm.NewStatusId == 3 && vm.InstructorId.HasValue) || // summit -> approve
                                        (report.StatusId == 7 && vm.NewStatusId == 8); // done -> published (chỉ Manager)
                    if (vm.NewStatusId == 3) report.InstructorId = vm.InstructorId;
                    break;
                case "Instructor":
                    isValidTransition = (report.StatusId == 3 && vm.NewStatusId == 4) || // approve -> process
                                        (report.StatusId == 4 && vm.NewStatusId == 5); // process -> created
                    break;
            }
            if (!isValidTransition) throw new Exception("Chuyển đổi trạng thái không hợp lệ.");
            report.StatusId = vm.NewStatusId;
            report.LastStatusUpdated = DateTime.Now;
            await _context.SaveChangesAsync();
            var newStatusName = await _context.ReportStatuses
                .Where(s => s.Id == vm.NewStatusId)
                .Select(s => s.Name)
                .FirstOrDefaultAsync();
            var recipients = new List<string>();
            if (vm.NewStatusId == 2) // Reject
            {
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.UserId)?.Email ?? "");
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.ReceiverId)?.Email ?? "");
            }
            else // Approve, Process, Created, Reviewing, Done, Published
            {
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.UserId)?.Email ?? ""); // Marketing
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.ReceiverId)?.Email ?? ""); // Manager
                if (report.InstructorId.HasValue)
                    recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.InstructorId)?.Email ?? ""); // Instructor
            }
            var subject = $"Cập nhật trạng thái báo cáo #{reportId}";
            var body = $"<h3>Trạng thái báo cáo đã được cập nhật thành {newStatusName}</h3>" +
                      $"<p>Thời gian: {DateTime.Now}</p>" +
                      $"<p>Người thực hiện: {profile.Name}</p>";
            foreach (var recipient in recipients.Where(r => !string.IsNullOrEmpty(r)))
            {
                await _mailService.SendEmailAsync(recipient, subject, body);
            }
            return (true, newStatusName);
        }

        public async Task<(bool Success, int CommentId)> AddCommentAsync(int reportId, CreateCommentVM vm, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            var comment = new ReportComment
            {
                ReportId = reportId,
                UserId = userId,
                CommentText = vm.CommentText,
                CreatedAt = DateTime.Now
            };
            _context.ReportComments.Add(comment);
            await _context.SaveChangesAsync();
            var commentId = comment.Id;
            var commentVm = new CommentReportVM
            {
                Id = commentId,
                CommentText = comment.CommentText,
                CreatedAt = (DateTime)comment.CreatedAt,
                UserName = profile.Name,
                RoleName = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync() ?? "Unknown"
            };
            var relatedUserIds = new[] { report.UserId, report.ReceiverId };
            if (report.InstructorId.HasValue)
                relatedUserIds = relatedUserIds.Append(report.InstructorId.Value).ToArray();
            foreach (var relatedUserId in relatedUserIds)
            {
                await _hubContext.Clients.Group($"User_{relatedUserId}").SendAsync("ReceiveComment", commentVm);
            }
            await _hubContext.Clients.Group($"Report_{reportId}").SendAsync("ReceiveComment", commentVm);
            return (true, commentId);
        }

        public async Task<Stream> DownloadReportFilesAsync(int reportId, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");

            var report = await _context.Reports.Include(r => r.ReportFiles)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == profile.UserId || r.ReceiverId == profile.UserId || r.InstructorId == profile.UserId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            if (!report.ReportFiles.Any()) throw new Exception("Không có file nào để tải.");

            var uploadFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "UploadFile");
            var reportFolder = Path.Combine(uploadFolder, $"Report_{reportId}");

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var file in report.ReportFiles)
                {
                    var fullPath = Path.Combine(reportFolder, Path.GetFileName(file.FilePath));
                    if (System.IO.File.Exists(fullPath))
                    {
                        // ✅ Tách tên gốc từ "Guid__TênGốc"
                        var originalName = Path.GetFileName(fullPath).Split("__").Last();
                        var entry = archive.CreateEntry(originalName);
                        using var entryStream = entry.Open();
                        using var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
                        await fileStream.CopyToAsync(entryStream);
                    }
                }
            }
            memoryStream.Seek(0, SeekOrigin.Begin);
            return new MemoryStream(memoryStream.ToArray());
        }
    }
}