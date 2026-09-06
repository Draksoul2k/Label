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
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public OrganizationController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrganization()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var org = await _context.Organizations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == orgId);

        if (org == null) return NotFound(new { message = "Không tìm thấy tổ chức" });

        return Ok(new OrganizationDto
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            LogoUrl = org.LogoUrl
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetMembers()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var members = await _context.Users
            .Where(u => u.OrgId == orgId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new OrgMemberDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString(),
                EmailVerified = u.IsEmailVerified,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(members);
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InviteMember([FromBody] InviteMemberRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        // Check if user is Owner or Admin
        if (_tenantService.CurrentUserRole != "Owner" && _tenantService.CurrentUserRole != "Admin" && !_tenantService.IsSystemAdmin)
            return Forbid();

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email và mật khẩu không được để trống" });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email))
            return BadRequest(new { message = "Email này đã được sử dụng trong hệ thống" });

        // Check plan user limit
        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == orgId && s.Status == SubscriptionStatus.Active);

        var planKey = sub?.Plan ?? "free";
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Key == planKey);
        if (plan != null && plan.MaxUsers != -1)
        {
            var currentCount = await _context.Users.CountAsync(u => u.OrgId == orgId);
            if (currentCount >= plan.MaxUsers)
                return BadRequest(new { message = $"Gói cước của bạn chỉ cho phép tối đa {plan.MaxUsers} thành viên. Vui lòng nâng cấp gói cước để mời thêm." });
        }

        var role = Enum.TryParse<UserRole>(request.Role, true, out var r) ? r : UserRole.Member;

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Email = email,
            Name = request.Name.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            IsSystemAdmin = false,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(newUser);

        await _context.ActivityLogs.AddAsync(new ActivityLog
        {
            OrgId = orgId.Value,
            UserId = _tenantService.CurrentUserId,
            Action = "InviteMember",
            Details = $"Đã mời thành viên {newUser.Email} ({role})"
        });

        await _context.SaveChangesAsync();

        return Ok(new OrgMemberDto
        {
            Id = newUser.Id,
            Name = newUser.Name,
            Email = newUser.Email,
            Role = newUser.Role.ToString(),
            EmailVerified = newUser.IsEmailVerified,
            CreatedAt = newUser.CreatedAt
        });
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (_tenantService.CurrentUserRole != "Owner" && !_tenantService.IsSystemAdmin)
            return Forbid();

        var member = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrgId == orgId);
        if (member == null) return NotFound(new { message = "Không tìm thấy thành viên" });

        if (member.Id == _tenantService.CurrentUserId)
            return BadRequest(new { message = "Bạn không thể tự thay đổi vai trò của chính mình" });

        if (Enum.TryParse<UserRole>(request.Role, true, out var role))
        {
            member.Role = role;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật vai trò thành công", role = role.ToString() });
        }

        return BadRequest(new { message = "Vai trò không hợp lệ" });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> RemoveMember(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (_tenantService.CurrentUserRole != "Owner" && !_tenantService.IsSystemAdmin)
            return Forbid();

        var member = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrgId == orgId);
        if (member == null) return NotFound(new { message = "Không tìm thấy thành viên" });

        if (member.Id == _tenantService.CurrentUserId)
            return BadRequest(new { message = "Bạn không thể tự xóa tài khoản của chính mình khỏi tổ chức" });

        _context.Users.Remove(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa thành viên thành công" });
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var logs = await _context.ActivityLogs
            .Where(l => l.OrgId == orgId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .Include(l => l.User)
            .Select(l => new ActivityLogDto
            {
                Id = l.Id,
                Action = l.Action,
                Details = l.Details,
                UserName = l.User != null ? l.User.Name : "Hệ thống",
                IpAddress = l.IpAddress,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }
}
