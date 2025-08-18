namespace ActiveLearningSystem.ViewModel.AuthenViewModels
{
    public class ResendOtpVM
    {
        public string Token { get; set; }  // JWT từ bước pre-register
        public string? NewEmail { get; set; }  // Email mới nếu muốn chỉnh sửa
    }
}
