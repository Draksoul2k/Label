using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public ProfileController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _tenantService.CurrentUserId;
        if (userId == null) return Unauthorized();

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound(new { message = "Không tìm thấy thông tin người dùng" });

        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == user.OrgId && s.Status == Core.Enums.SubscriptionStatus.Active);

        var planKey = user.IsSystemAdmin ? "Business" : (sub?.Plan?.ToLower() switch
        {
            "business" => "Business",
            "pro" => "Pro",
            "basic" => "Basic",
            _ => sub?.PlanName ?? "Free"
        });

        return Ok(new ProfileDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Company = user.Organization?.Name ?? "",
            LogoUrl = user.Organization?.LogoUrl,
            Role = user.Role.ToString(),
            Plan = planKey,
            EmailVerified = user.IsEmailVerified
        });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = _tenantService.CurrentUserId;
        if (userId == null) return Unauthorized();

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Name = request.Name.Trim();

        if (request.Phone != null)
            user.Phone = request.Phone.Trim();

        if (user.Organization != null)
        {
            if (!string.IsNullOrWhiteSpace(request.Company))
                user.Organization.Name = request.Company.Trim();
            if (request.LogoUrl != null)
                user.Organization.LogoUrl = request.LogoUrl;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Cập nhật hồ sơ thành công" });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = _tenantService.CurrentUserId;
        if (userId == null) return Unauthorized();

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không chính xác" });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }
}
