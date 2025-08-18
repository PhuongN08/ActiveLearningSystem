using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ActiveLearningSystem.Services.AuthenServices
{
    public class AccountService : IAccountService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly PasswordHasher<Account> _hasher;
        private readonly IMailService _mailService;
        private readonly IConfiguration _config;
        private readonly int _maxResendAttempts = 3; // Giới hạn gửi lại OTP
        private readonly Dictionary<string, int> _resendAttempts = new(); // Theo dõi số lần gửi lại

        public AccountService(AlsContext context, IMapper mapper, IMailService mailService, IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _hasher = new PasswordHasher<Account>(); // <-- Khởi tạo PasswordHasher
            _mailService = mailService;
            _config = config;
        }

        public async Task<string> PreRegisterAsync(CreateAccountVM model)
        {
            model.Name = model.Name?.Trim();
            model.Address = model.Address?.Trim();
            model.Phone = model.Phone?.Trim();
            model.Email = model.Email?.Trim();
            model.Username = model.Username?.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(model.Name) || model.Name.Length > 50)
                throw new Exception("Tên không được để trống và tối đa 50 ký tự.");
            if (string.IsNullOrWhiteSpace(model.Address) || model.Address.Length > 200)
                throw new Exception("Địa chỉ không được để trống và tối đa 200 ký tự.");
            if (!Regex.IsMatch(model.Email, @"^[\w\.-]+@[\w\.-]+\.\w+$"))
                throw new Exception("Email không hợp lệ.");
            if (!Regex.IsMatch(model.Phone, @"^(0|\\+84)[0-9]{9,10}$"))
                throw new Exception("Số điện thoại không hợp lệ.");
            if (string.IsNullOrWhiteSpace(model.Username) || model.Username.Length < 4 || model.Username.Length > 50)
                throw new Exception("Username phải từ 4-50 ký tự.");
            if (string.IsNullOrWhiteSpace(model.Password) || model.Password.Length < 6)
                throw new Exception("Mật khẩu phải từ 6 ký tự trở lên.");

            if (await _context.Accounts.AnyAsync(a => a.Username.ToLower() == model.Username.ToLower()))
                throw new Exception("Tên đăng nhập đã tồn tại.");
            if (await _context.Profiles.AnyAsync(p => p.Email == model.Email))
                throw new Exception("Email đã được sử dụng.");
            if (await _context.Profiles.AnyAsync(p => p.Phone == model.Phone))
                throw new Exception("Số điện thoại đã được sử dụng.");
            if (model.RoleId != 6 && model.RoleId != 7)
                throw new Exception("Role không hợp lệ.");

            var otp = new Random().Next(100000, 999999).ToString();
            try
            {
                await _mailService.SendEmailAsync(
                    model.Email,
                    "Mã xác thực đăng ký tài khoản ALS",
                    $"<h3>Mã OTP của bạn là: <b>{otp}</b></h3><p>Vui lòng nhập mã này trong vòng 5 phút để xác thực email.</p>"
                );
            }
            catch (SmtpException ex)
            {
                if (ex.StatusCode == SmtpStatusCode.MailboxUnavailable) // Mã 550: Mailbox unavailable
                    throw new Exception("Email không hợp lệ hoặc không tồn tại.");
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }
            catch (Exception)
            {
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }

            var jwtToken = OtpTokenHelper.CreateOtpToken(model, otp, _config["Jwt:Issuer"], _config["Jwt:Key"]);
            return jwtToken;
        }

        public async Task<string> ResendOtpAsync(ResendOtpVM model)
        {
            var payload = OtpTokenHelper.DecodeOtpToken<CreateAccountVM>(model.Token, out var otp, out var expiredAt);

            if (expiredAt < DateTime.UtcNow)
                throw new Exception("Token đã hết hạn. Vui lòng bắt đầu lại quá trình đăng ký.");

            string emailToUse = string.IsNullOrWhiteSpace(model.NewEmail) ? payload.Email : model.NewEmail.Trim();
            if (!string.IsNullOrWhiteSpace(model.NewEmail) && !Regex.IsMatch(model.NewEmail, @"^[\w\.-]+@[\w\.-]+\.\w+$"))
                throw new Exception("Email mới không hợp lệ.");

            if (await _context.Profiles.AnyAsync(p => p.Email == emailToUse))
                throw new Exception("Email đã được sử dụng.");

            var tokenKey = model.Token.GetHashCode().ToString();
            if (_resendAttempts.ContainsKey(tokenKey) && _resendAttempts[tokenKey] >= _maxResendAttempts)
                throw new Exception($"Đã đạt giới hạn {_maxResendAttempts} lần gửi lại. Vui lòng bắt đầu lại.");

            var newOtp = new Random().Next(100000, 999999).ToString();
            try
            {
                await _mailService.SendEmailAsync(
                    emailToUse,
                    "Mã xác thực đăng ký tài khoản ALS (Gửi lại)",
                    $"<h3>Mã OTP của bạn là: <b>{newOtp}</b></h3><p>Vui lòng nhập mã này trong vòng 5 phút để xác thực email.</p>"
                );
                _resendAttempts[tokenKey] = _resendAttempts.GetValueOrDefault(tokenKey, 0) + 1;
            }
            catch (SmtpException ex)
            {
                if (ex.StatusCode == SmtpStatusCode.MailboxUnavailable) // Mã 550: Mailbox unavailable
                    throw new Exception("Email không hợp lệ hoặc không tồn tại.");
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }
            catch (Exception)
            {
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }

            return OtpTokenHelper.CreateOtpToken(payload, newOtp, _config["Jwt:Issuer"], _config["Jwt:Key"]);
        }

        public async Task<bool> VerifyAndCreateAccountAsync(string token, string otp)
        {
            var payload = OtpTokenHelper.DecodeOtpToken<CreateAccountVM>(token, out var otpFromToken, out var expiredAt);

            if (otp != otpFromToken)
                throw new Exception("OTP không chính xác.");
            if (expiredAt < DateTime.UtcNow)
                throw new Exception("OTP đã hết hạn.");

            var account = _mapper.Map<Account>(payload);
            account.Password = _hasher.HashPassword(account, payload.Password); // ⚠️ Hash tại đây
            account.IsVerified = true;
            account.Status = true;

            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();

            var profile = _mapper.Map<Model.Profile>(payload);
            profile.AccountId = account.Id;

            await _context.Profiles.AddAsync(profile);
            await _context.SaveChangesAsync();

            return true;
        }

        private string HashToken(string token)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        //  pre reset pass function
        public async Task<bool> RequestResetPasswordAsync(string email)
        {
            var profile = await _context.Profiles.Include(p => p.Account)
                .FirstOrDefaultAsync(p => p.Email == email);
            if (profile == null) return false;

            var rawToken = Guid.NewGuid().ToString(); // Gửi qua mail
            var hashedToken = HashToken(rawToken);    // Lưu vào DB

            var expiration = DateTime.UtcNow.AddMinutes(2);
            var resetToken = new PasswordResetToken
            {
                AccountId = profile.AccountId,
                Token = hashedToken,
                Expiration = expiration,
                IsUsed = false
            };

            await _context.PasswordResetTokens.AddAsync(resetToken);
            await _context.SaveChangesAsync();

            var resetLink = $"https://localhost:3000/forget2?token={rawToken}";

            var subject = "ALS - Reset mật khẩu";
            var body = $"<p>Click để đặt lại mật khẩu:</p><a href='{resetLink}'>{resetLink}</a><p>Link hết hạn sau 2 phút.</p>";

            await _mailService.SendEmailAsync(email, subject, body);
            return true;
        }

        // reset pass function
        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var hashedToken = HashToken(token);
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == hashedToken && !t.IsUsed && t.Expiration > DateTime.UtcNow);

            if (resetToken == null) return false;

            var account = await _context.Accounts.FindAsync(resetToken.AccountId);
            if (account == null) return false;

            //account.Password = newPassword; // chua hass pass, muon hass -> cmt dong nay, mo dong duoi

            // ✅ Hash mật khẩu mới
            account.Password = _hasher.HashPassword(account, newPassword);

            resetToken.IsUsed = true;
            resetToken.Expiration = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // change pass function 
        public async Task<bool> ChangePasswordAsync(ChangePasswordVM model, int accountId)
        {
            var oldPass = model.OldPassword?.Trim();
            var newPass = model.NewPassword?.Trim();

            if (string.IsNullOrWhiteSpace(oldPass))
                throw new Exception("Mật khẩu cũ là bắt buộc.");

            if (string.IsNullOrWhiteSpace(newPass))
                throw new Exception("Mật khẩu mới là bắt buộc.");

            if (newPass.Length < 6)
                throw new Exception("Mật khẩu mới phải từ 6 ký tự trở lên và không được chỉ chứa khoảng trắng.");

            if (newPass != model.ConfirmPassword?.Trim())
                throw new Exception("Mật khẩu xác nhận không khớp.");

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
                throw new Exception("Tài khoản không tồn tại.");

            var verify = _hasher.VerifyHashedPassword(account, account.Password, oldPass);
            if (verify != PasswordVerificationResult.Success)
                throw new Exception("Mật khẩu cũ không đúng.");

            account.Password = _hasher.HashPassword(account, newPass);
            account.UpdatedDate = DateOnly.FromDateTime(DateTime.UtcNow);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
