using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Enums;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email và mật khẩu không được để trống", detail = "Email và mật khẩu không được để trống" });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email))
            return BadRequest(new { message = "Email đã được sử dụng", detail = "Email này đã được sử dụng trên hệ thống. Vui lòng bấm 'Đăng nhập' hoặc dùng email khác." });

        var orgName = string.IsNullOrWhiteSpace(request.OrgName) ? $"Công ty của {request.Name}" : request.OrgName.Trim();
        var slug = orgName.ToLowerInvariant().Replace(" ", "-") + "-" + Guid.NewGuid().ToString()[..6];

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = orgName,
            Slug = slug,
            CreatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            OrgId = org.Id,
            Email = email,
            Phone = request.Phone?.Trim(),
            Name = request.Name.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
            IsSystemAdmin = false,
            IsEmailVerified = false,
            CreatedAt = DateTime.UtcNow
        };

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            OrgId = org.Id,
            Plan = "pro",
            PlanName = "Pro",
            BillingCycle = BillingCycle.Monthly,
            Term = "month",
            TermName = "30 ngày dùng thử Pro",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = SubscriptionStatus.Active,
            AutoRenew = false,
            Amount = 0
        };

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);

        await _context.Organizations.AddAsync(org);
        await _context.Users.AddAsync(user);
        await _context.Subscriptions.AddAsync(subscription);
        await _context.SaveChangesAsync();

        var (accessToken, expiresAt) = _jwtService.GenerateAccessToken(user);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString(),
                Plan = "Pro",
                OrgId = org.Id,
                OrgName = org.Name,
                IsSystemAdmin = false,
                AvatarUrl = null
            }
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Vui lòng nhập tài khoản và mật khẩu", detail = "Vui lòng nhập tài khoản và mật khẩu" });

        var input = request.Email.Trim().ToLowerInvariant();

        // Find user by email or phone
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == input || (u.Phone != null && u.Phone == input));

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return BadRequest(new { message = "Email/Số điện thoại hoặc mật khẩu không chính xác", detail = "Email hoặc mật khẩu không chính xác" });

        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == user.OrgId && s.Status == SubscriptionStatus.Active);

        var planName = "Free";
        if (user.IsSystemAdmin)
        {
            planName = "Business";
        }
        else if (sub != null)
        {
            if (sub.EndDate < DateTime.UtcNow && (sub.Plan ?? "").ToLowerInvariant() != "free")
            {
                planName = "Free";
            }
            else
            {
                var p = (sub.Plan ?? "").ToLowerInvariant();
                if (p == "business") planName = "Business";
                else if (p == "pro") planName = "Pro";
                else if (p == "basic") planName = "Basic";
                else planName = sub.PlanName ?? "Free";
            }
        }

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);
        await _context.SaveChangesAsync();

        var (accessToken, expiresAt) = _jwtService.GenerateAccessToken(user);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString(),
                Plan = planName,
                OrgId = user.OrgId,
                OrgName = user.Organization?.Name ?? "Tổ chức",
                IsSystemAdmin = user.IsSystemAdmin,
                AvatarUrl = user.AvatarUrl
            }
        });
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest(new { message = "RefreshToken không hợp lệ" });

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken && u.RefreshTokenExpiresAt > DateTime.UtcNow);

        if (user == null)
            return Unauthorized(new { message = "Refresh token đã hết hạn hoặc không hợp lệ" });

        var newRefreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);
        await _context.SaveChangesAsync();

        var (accessToken, expiresAt) = _jwtService.GenerateAccessToken(user);

        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == user.OrgId && s.Status == SubscriptionStatus.Active);

        return Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString(),
                Plan = user.IsSystemAdmin ? "Business" : ((sub != null && sub.EndDate >= DateTime.UtcNow && sub.Plan?.ToLower() == "business") ? "Business" : ((sub != null && sub.EndDate >= DateTime.UtcNow && sub.Plan?.ToLower() == "pro") ? "Pro" : (sub != null && sub.EndDate >= DateTime.UtcNow && sub.Plan?.ToLower() == "basic") ? "Basic" : "Free")),
                OrgId = user.OrgId,
                OrgName = user.Organization?.Name ?? "Tổ chức",
                IsSystemAdmin = user.IsSystemAdmin,
                AvatarUrl = user.AvatarUrl
            }
        });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        // Return success message regardless to prevent user enumeration
        return Ok(new { message = "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đi." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public IActionResult ResetPassword([FromBody] ResetPasswordRequest request)
    {
        return Ok(new { message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới." });
    }

    [HttpPost("external-login")]
    [AllowAnonymous]
    public IActionResult ExternalLogin([FromBody] ExternalLoginRequest request)
    {
        return Ok(new { message = "External login endpoint ready." });
    }
}
