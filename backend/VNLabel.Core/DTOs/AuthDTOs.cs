using VNLabel.Core.Enums;

namespace VNLabel.Core.DTOs;

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string OrgName { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty; // Can be email or phone
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ExternalLoginRequest
{
    public string Provider { get; set; } = "Google";
    public string Token { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Member";
    public string Plan { get; set; } = "Free";
    public Guid OrgId { get; set; }
    public string OrgName { get; set; } = string.Empty;
    public bool IsSystemAdmin { get; set; }
    public string? AuthProvider { get; set; }
    public string? AvatarUrl { get; set; }
}
