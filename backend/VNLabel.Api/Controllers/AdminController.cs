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
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public AdminController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    private bool IsAdmin => _tenantService.IsSystemAdmin || _tenantService.CurrentUserRole == "Owner";

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!IsAdmin) return Forbid();

        var totalUsers = await _context.Users.IgnoreQueryFilters().CountAsync();
        var totalOrgs = await _context.Organizations.IgnoreQueryFilters().CountAsync();
        var totalBarcodes = await _context.BarcodeItems.IgnoreQueryFilters().CountAsync();
        var activeSubs = await _context.Subscriptions.IgnoreQueryFilters().CountAsync(s => s.Status == SubscriptionStatus.Active && s.Plan != "free");
        var pendingReqs = await _context.SubscriptionRequests.IgnoreQueryFilters().CountAsync(r => r.Status == RequestStatus.Pending);

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);

        var currentQuarter = (now.Month - 1) / 3 + 1;
        var startOfQuarter = new DateTime(now.Year, (currentQuarter - 1) * 3 + 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfQuarter = startOfQuarter.AddMonths(3);

        var startOfYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfYear = startOfYear.AddYears(1);

        // Lấy danh sách OrgId của Admin để không tính tiền vào doanh thu
        var adminOrgIds = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => u.IsSystemAdmin || u.Email == "admin@hacode.vn")
            .Select(u => u.OrgId)
            .Distinct()
            .ToListAsync();

        // Tính doanh thu theo số người đăng ký kích hoạt trong tháng, quý, năm (loại trừ gói thử nghiệm 30 ngày và Admin)
        var allActivePaidSubs = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.Status == SubscriptionStatus.Active && s.Plan != "free")
            .ToListAsync();

        decimal monthlyRevenue = 0;
        decimal quarterlyRevenue = 0;
        decimal yearlyRevenue = 0;

        foreach (var sub in allActivePaidSubs)
        {
            if (adminOrgIds.Contains(sub.OrgId)) continue;

            var planKey = (sub.Plan ?? "").ToLowerInvariant();
            if (planKey == "free") continue;

            // Bỏ qua các gói dùng thử miễn phí 30 ngày do Admin cấp
            bool isTrial = sub.Term == "trial" || 
                           (sub.TermName != null && sub.TermName.ToLower().Contains("thử")) ||
                           (sub.Amount == 0 && (sub.Term == "trial" || (planKey == "pro" && sub.StartDate.AddDays(35) >= sub.EndDate)));

            if (isTrial) continue;

            decimal planPrice = sub.Amount > 0 ? sub.Amount : (planKey switch
            {
                "pro" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 699000 : 59000,
                "business" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 1990000 : 166000,
                "basic" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 790000 : 79000,
                _ => 59000
            });

            // Người đăng ký / kích hoạt trong tháng này
            if (sub.StartDate >= startOfMonth && sub.StartDate < endOfMonth)
            {
                monthlyRevenue += planPrice;
            }

            // Người đăng ký / kích hoạt trong quý này
            if (sub.StartDate >= startOfQuarter && sub.StartDate < endOfQuarter)
            {
                quarterlyRevenue += planPrice;
            }

            // Người đăng ký / kích hoạt trong năm này
            if (sub.StartDate >= startOfYear && sub.StartDate < endOfYear)
            {
                yearlyRevenue += planPrice;
            }
        }

        return Ok(new AdminStatsDto
        {
            TotalUsers = totalUsers,
            TotalOrganizations = totalOrgs,
            TotalBarcodes = totalBarcodes,
            ActiveSubscriptions = activeSubs,
            PendingRequests = pendingReqs,
            MonthlyRevenue = monthlyRevenue,
            Mrr = monthlyRevenue,
            QuarterlyRevenue = quarterlyRevenue,
            YearlyRevenue = yearlyRevenue
        });
    }

    [HttpGet("subscription-requests")]
    public async Task<IActionResult> GetSubscriptionRequests()
    {
        if (!IsAdmin) return Forbid();

        var requests = await _context.SubscriptionRequests
            .IgnoreQueryFilters()
            .Include(r => r.Organization)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SubscriptionRequestDto
            {
                Id = r.Id,
                OrgId = r.OrgId,
                OrgName = r.Organization != null ? r.Organization.Name : "Tổ chức",
                Plan = r.Plan,
                Cycle = r.Cycle,
                ContactName = r.ContactName,
                ContactPhone = r.ContactPhone,
                Status = r.Status.ToString(),
                Note = r.Note,
                AdminNote = r.AdminNote,
                CreatedAt = r.CreatedAt,
                ProcessedAt = r.ProcessedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("subscription-requests/{id}/approve")]
    public async Task<IActionResult> ApproveRequest(Guid id, [FromBody] ApproveRequestBody? body)
    {
        if (!IsAdmin) return Forbid();

        var req = await _context.SubscriptionRequests
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu" });

        req.Status = RequestStatus.Approved;
        req.AdminNote = body?.Note;
        req.ProcessedAt = DateTime.UtcNow;

        var cycle = body?.Cycle ?? req.Cycle;
        bool isTrial = cycle == "trial";
        var months = cycle == "year" ? 12 : (cycle == "2year" ? 24 : 1);
        var termName = isTrial ? "30 ngày dùng thử Pro" : (cycle == "year" ? "1 năm" : (cycle == "2year" ? "2 năm" : "1 tháng"));

        var plan = await _context.SubscriptionPlans
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Key == req.Plan);

        var amount = isTrial ? 0 : ((plan?.PriceMonthly ?? 0) * months);
        if (cycle == "year" && plan != null) amount = plan.PriceYearly;
        if (cycle == "2year" && plan != null) amount = plan.PriceYearly * 2;

        var existingSub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == req.OrgId);

        var baseDate = (existingSub != null && existingSub.EndDate > DateTime.UtcNow && existingSub.Plan?.ToLower() == "pro")
            ? existingSub.EndDate
            : DateTime.UtcNow;

        var targetEndDate = isTrial ? baseDate.AddDays(30) : DateTime.UtcNow.AddMonths(months);

        if (existingSub != null)
        {
            existingSub.Plan = req.Plan;
            existingSub.PlanName = plan?.Name ?? req.Plan.ToUpperInvariant();
            existingSub.BillingCycle = cycle == "year" ? BillingCycle.Yearly : BillingCycle.Monthly;
            existingSub.Term = cycle;
            existingSub.TermName = termName;
            existingSub.StartDate = DateTime.UtcNow;
            existingSub.EndDate = targetEndDate;
            existingSub.Status = SubscriptionStatus.Active;
            existingSub.Amount = amount;
        }
        else
        {
            var newSub = new Subscription
            {
                Id = Guid.NewGuid(),
                OrgId = req.OrgId,
                Plan = req.Plan,
                PlanName = plan?.Name ?? req.Plan.ToUpperInvariant(),
                BillingCycle = cycle == "year" ? BillingCycle.Yearly : BillingCycle.Monthly,
                Term = cycle,
                TermName = termName,
                StartDate = DateTime.UtcNow,
                EndDate = targetEndDate,
                Status = SubscriptionStatus.Active,
                Amount = amount
            };
            await _context.Subscriptions.AddAsync(newSub);
        }

        // Create Invoice
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            OrgId = req.OrgId,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18].ToUpperInvariant(),
            Amount = amount,
            Status = "Paid",
            PaidAt = DateTime.UtcNow
        };
        await _context.Invoices.AddAsync(invoice);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã phê duyệt và kích hoạt gói cước thành công!" });
    }

    [HttpPost("subscription-requests/{id}/reject")]
    public async Task<IActionResult> RejectRequest(Guid id, [FromBody] RejectRequestBody body)
    {
        if (!IsAdmin) return Forbid();

        var req = await _context.SubscriptionRequests
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu" });

        req.Status = RequestStatus.Rejected;
        req.AdminNote = body.Note;
        req.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã từ chối yêu cầu" });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        if (!IsAdmin) return Forbid();

        var query = _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(s) || u.Email.ToLower().Contains(s) || (u.Organization != null && u.Organization.Name.ToLower().Contains(s)));
        }

        var usersList = await query
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var orgIds = usersList.Select(u => u.OrgId).Distinct().ToList();
        var subs = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => orgIds.Contains(s.OrgId))
            .ToListAsync();

        var subMap = subs
            .GroupBy(s => s.OrgId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.StartDate).FirstOrDefault());

        var result = usersList.Select(u =>
        {
            subMap.TryGetValue(u.OrgId, out var sub);
            var planKey = u.IsSystemAdmin ? "Business" : (sub?.Plan?.ToLower() switch
            {
                "business" => "Business",
                "pro" => "Pro",
                "basic" => "Basic",
                _ => "Free"
            });
            var planName = u.IsSystemAdmin ? "Business" : (sub?.PlanName ?? planKey);

            bool isAdminUser = u.IsSystemAdmin || (u.Email != null && u.Email.ToLower() == "admin@hacode.vn");
            bool isTrial = !isAdminUser && sub != null && (
                sub.Term == "trial" || 
                (sub.TermName != null && sub.TermName.ToLower().Contains("thử")) ||
                (sub.Amount == 0 && (sub.Term == "trial" || (planKey.ToLower() == "pro" && sub.StartDate.AddDays(35) >= sub.EndDate)))
            );

            decimal userRev = 0;
            string revText = "0 đ";
            if (isAdminUser || planKey.ToLower() == "free" || sub == null)
            {
                userRev = 0;
                revText = "0 đ";
            }
            else if (isTrial)
            {
                userRev = 0;
                revText = "0 đ (Dùng thử)";
            }
            else
            {
                userRev = sub.Amount > 0 ? sub.Amount : (planKey.ToLower() switch
                {
                    "pro" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 699000 : 59000,
                    "business" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 1990000 : 166000,
                    "basic" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 790000 : 79000,
                    _ => 0
                });
                revText = userRev.ToString("N0") + " đ";
            }

            return new AdminUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role.ToString(),
                OrgId = u.OrgId,
                OrgName = u.Organization != null ? u.Organization.Name : "Tổ chức",
                Plan = planKey,
                PlanName = planName,
                PlanEndDate = u.IsSystemAdmin ? null : sub?.EndDate,
                IsSystemAdmin = u.IsSystemAdmin,
                CreatedAt = u.CreatedAt,
                Revenue = userRev,
                RevenueText = revText
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPut("users/{id}/plan")]
    public async Task<IActionResult> ChangeUserPlan(Guid id, [FromBody] AdminChangePlanRequest body)
    {
        if (!IsAdmin) return Forbid();

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

        var sub = await _context.Subscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.OrgId == user.OrgId);
        var planKey = body.Plan?.ToLowerInvariant() ?? "pro";
        var plan = await _context.SubscriptionPlans.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Key.ToLower() == planKey);

        bool isTrial = body.Cycle == "trial";
        var months = body.Cycle == "year" ? 12 : (body.Cycle == "2year" ? 24 : 1);
        var termName = isTrial ? "30 ngày dùng thử Pro" : (body.Cycle == "year" ? "1 năm" : (body.Cycle == "2year" ? "2 năm" : "1 tháng"));
        var startDate = DateTime.TryParse(body.StartDate, out var parsedStart) ? parsedStart.ToUniversalTime() : DateTime.UtcNow;

        var baseDate = (sub != null && sub.EndDate > DateTime.UtcNow && sub.Plan?.ToLower() == "pro")
            ? sub.EndDate
            : startDate;

        var targetEndDate = planKey == "free" 
            ? DateTime.UtcNow.AddYears(100) 
            : (isTrial ? baseDate.AddDays(30) : startDate.AddMonths(months));

        decimal amount = 0;
        if (!isTrial && planKey != "free")
        {
            if (body.Cycle == "year") amount = plan?.PriceYearly ?? (planKey == "business" ? 1990000 : 699000);
            else if (body.Cycle == "2year") amount = (plan?.PriceYearly ?? (planKey == "business" ? 1990000 : 699000)) * 2;
            else amount = (plan?.PriceMonthly ?? (planKey == "business" ? 166000 : 59000)) * months;
        }

        if (sub != null)
        {
            sub.Plan = planKey;
            sub.PlanName = plan?.Name ?? (char.ToUpper(planKey[0]) + planKey[1..]);
            sub.BillingCycle = body.Cycle == "year" ? BillingCycle.Yearly : BillingCycle.Monthly;
            sub.Term = body.Cycle;
            sub.TermName = termName;
            sub.StartDate = startDate;
            sub.EndDate = targetEndDate;
            sub.Status = SubscriptionStatus.Active;
            sub.Amount = amount;
        }
        else
        {
            sub = new Subscription
            {
                Id = Guid.NewGuid(),
                OrgId = user.OrgId,
                Plan = planKey,
                PlanName = plan?.Name ?? (char.ToUpper(planKey[0]) + planKey[1..]),
                BillingCycle = body.Cycle == "year" ? BillingCycle.Yearly : BillingCycle.Monthly,
                Term = body.Cycle,
                TermName = termName,
                StartDate = startDate,
                EndDate = targetEndDate,
                Status = SubscriptionStatus.Active,
                AutoRenew = true,
                Amount = amount
            };
            await _context.Subscriptions.AddAsync(sub);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Đã cập nhật gói cước thành {sub.PlanName} thành công!" });
    }


    [HttpGet("expiring")]
    public async Task<IActionResult> GetExpiring()
    {
        if (!IsAdmin) return Forbid();

        var threshold = DateTime.UtcNow.AddDays(7);
        var expiring = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Include(s => s.Organization)
            .Where(s => s.Status == SubscriptionStatus.Active && s.Plan != "free" && s.EndDate <= threshold)
            .Select(s => new
            {
                s.Id,
                OrgName = s.Organization != null ? s.Organization.Name : "",
                s.PlanName,
                s.EndDate
            })
            .ToListAsync();

        return Ok(expiring);
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        if (!IsAdmin) return Forbid();

        // Lấy danh sách OrgId của Admin để không tính tiền vào doanh thu
        var adminOrgIds = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => u.IsSystemAdmin || u.Email == "admin@hacode.vn")
            .Select(u => u.OrgId)
            .Distinct()
            .ToListAsync();

        var allUsers = await _context.Users
            .IgnoreQueryFilters()
            .ToListAsync();

        var allSubs = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.Status == SubscriptionStatus.Active)
            .ToListAsync();

        var subMap = allSubs
            .GroupBy(s => s.OrgId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.StartDate).FirstOrDefault());

        // 1. Phân bổ người dùng theo gói
        var usersByPlan = new Dictionary<string, int>
        {
            { "Free", 0 },
            { "Pro", 0 },
            { "Business", 0 }
        };

        foreach (var user in allUsers)
        {
            subMap.TryGetValue(user.OrgId, out var sub);
            var planKey = user.IsSystemAdmin ? "Business" : (sub?.Plan?.ToLower() switch
            {
                "business" => "Business",
                "pro" => "Pro",
                "basic" => "Basic",
                _ => "Free"
            });

            if (!usersByPlan.ContainsKey(planKey))
                usersByPlan[planKey] = 0;
            usersByPlan[planKey]++;
        }

        // 2. Doanh thu theo gói (Quy đổi về mỗi tháng MRR)
        var revenueByPlan = new Dictionary<string, decimal>
        {
            { "Free", 0 },
            { "Pro", 0 },
            { "Business", 0 }
        };

        foreach (var sub in allSubs)
        {
            if (adminOrgIds.Contains(sub.OrgId)) continue;

            var planKey = (sub.Plan ?? "").ToLowerInvariant();
            if (planKey == "free") continue;

            bool isTrial = sub.Term == "trial" || 
                           (sub.TermName != null && sub.TermName.ToLower().Contains("thử")) ||
                           (sub.Amount == 0 && (sub.Term == "trial" || (planKey == "pro" && sub.StartDate.AddDays(35) >= sub.EndDate)));

            if (isTrial) continue;

            decimal mrr = 0;
            if (sub.Amount > 0)
            {
                var cycle = sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 12 : 1;
                mrr = sub.Amount / cycle;
            }
            else
            {
                if (planKey == "pro")
                {
                    mrr = (sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year") ? 699000m / 12 : 59000m;
                }
                else if (planKey == "business")
                {
                    mrr = (sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year") ? 1990000m / 12 : 166000m;
                }
                else if (planKey == "basic")
                {
                    mrr = (sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year") ? 790000m / 12 : 79000m;
                }
            }

            var keyName = char.ToUpper(planKey[0]) + planKey[1..];
            if (!revenueByPlan.ContainsKey(keyName))
                revenueByPlan[keyName] = 0;
            revenueByPlan[keyName] += Math.Round(mrr, 0);
        }

        // 3. Mức sử dụng toàn hệ thống (mã vạch tạo theo 6 tháng gần nhất)
        var now = DateTime.UtcNow;
        var systemUsage = new List<SystemUsageDto>();
        for (int i = 5; i >= 0; i--)
        {
            var targetMonth = now.AddMonths(-i);
            var startOfTarget = new DateTime(targetMonth.Year, targetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfTarget = startOfTarget.AddMonths(1);

            var count = await _context.BarcodeItems
                .IgnoreQueryFilters()
                .CountAsync(b => b.CreatedAt >= startOfTarget && b.CreatedAt < endOfTarget);

            systemUsage.Add(new SystemUsageDto
            {
                Month = $"T{targetMonth.Month}/{targetMonth.Year}",
                Count = count
            });
        }

        return Ok(new AdminReportsDto
        {
            RevenueByPlan = revenueByPlan,
            UsersByPlan = usersByPlan,
            SystemUsage = systemUsage
        });
    }

    [HttpGet("users/{id}/details")]
    public async Task<IActionResult> GetUserDetails(Guid id)
    {
        if (!IsAdmin) return Forbid();

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.OrgId == user.OrgId)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        var barcodeCount = await _context.BarcodeItems
            .IgnoreQueryFilters()
            .CountAsync(b => b.OrgId == user.OrgId);

        var templateCount = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .CountAsync(t => t.OrgId == user.OrgId);

        var memberCount = await _context.Users
            .IgnoreQueryFilters()
            .CountAsync(u => u.OrgId == user.OrgId);

        var planKey = user.IsSystemAdmin ? "Business" : (sub?.Plan?.ToLower() switch
        {
            "business" => "Business",
            "pro" => "Pro",
            "basic" => "Basic",
            _ => "Free"
        });

        bool isTrial = !user.IsSystemAdmin && sub != null && (
            sub.Term == "trial" || 
            (sub.TermName != null && sub.TermName.ToLower().Contains("thử")) ||
            (sub.Amount == 0 && (sub.Term == "trial" || (planKey.ToLower() == "pro" && sub.StartDate.AddDays(35) >= sub.EndDate)))
        );

        decimal userRev = 0;
        string revText = "0 đ";
        if (user.IsSystemAdmin || planKey.ToLower() == "free" || sub == null)
        {
            userRev = 0;
            revText = "0 đ";
        }
        else if (isTrial)
        {
            userRev = 0;
            revText = "0 đ (Dùng thử)";
        }
        else
        {
            userRev = sub.Amount > 0 ? sub.Amount : (planKey.ToLower() switch
            {
                "pro" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 699000 : 59000,
                "business" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 1990000 : 166000,
                "basic" => sub.BillingCycle == BillingCycle.Yearly || sub.Term == "year" ? 790000 : 79000,
                _ => 0
            });
            revText = userRev.ToString("N0") + " đ";
        }

        return Ok(new AdminUserDetailsDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Company = user.Organization?.Name ?? "Tổ chức",
            OrgId = user.OrgId,
            Role = user.Role.ToString(),
            IsSystemAdmin = user.IsSystemAdmin,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt,
            Plan = planKey,
            PlanName = user.IsSystemAdmin ? "Business" : (sub?.PlanName ?? planKey),
            PlanStartDate = sub?.StartDate ?? user.CreatedAt,
            PlanEndDate = user.IsSystemAdmin ? null : sub?.EndDate,
            TermName = isTrial ? "30 ngày dùng thử Pro" : (sub?.TermName ?? (user.IsSystemAdmin ? "Vô thời hạn" : "Mặc định")),
            Revenue = userRev,
            RevenueText = revText,
            BarcodeCount = barcodeCount,
            TemplateCount = templateCount,
            MemberCount = memberCount
        });
    }

    [HttpPost("users/{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] AdminResetPasswordRequest? body)
    {
        if (!IsAdmin) return Forbid();

        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

        var newPass = string.IsNullOrWhiteSpace(body?.NewPassword) ? "12345678" : body.NewPassword.Trim();
        if (newPass.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPass);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã đặt lại mật khẩu cho tài khoản {user.Email} thành công!",
            email = user.Email,
            name = user.Name,
            newPassword = newPass
        });
    }

    [HttpGet("support")]
    public async Task<IActionResult> GetSupport([FromQuery] string? email)
    {
        if (!IsAdmin) return Forbid();
        if (string.IsNullOrWhiteSpace(email)) return Ok(new { found = false });

        var search = email.Trim().ToLower();
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == search || u.Name.ToLower().Contains(search));

        if (user == null) return Ok(new { found = false });

        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.OrgId == user.OrgId)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        var barcodeCount = await _context.BarcodeItems
            .IgnoreQueryFilters()
            .CountAsync(b => b.OrgId == user.OrgId);

        var memberCount = await _context.Users
            .IgnoreQueryFilters()
            .CountAsync(u => u.OrgId == user.OrgId);

        var planKey = user.IsSystemAdmin ? "Business" : (sub?.Plan?.ToLower() switch
        {
            "business" => "Business",
            "pro" => "Pro",
            "basic" => "Basic",
            _ => "Free"
        });

        return Ok(new
        {
            found = true,
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            company = user.Organization?.Name ?? "Tổ chức",
            role = user.Role.ToString(),
            plan = planKey,
            emailVerified = user.IsEmailVerified,
            planStartDate = sub?.StartDate ?? user.CreatedAt,
            planEndDate = user.IsSystemAdmin ? (DateTime?)null : sub?.EndDate,
            memberCount,
            barcodeCount,
            createdAt = user.CreatedAt
        });
    }
}
