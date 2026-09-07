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

        // MRR Calculation (Method 2: based on active subscriptions, excluding admin-granted 30-day trial)
        var activeSubsList = await _context.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate >= DateTime.UtcNow)
            .ToListAsync();

        decimal mrr = 0;
        foreach (var sub in activeSubsList)
        {
            var planKey = (sub.Plan ?? "").ToLowerInvariant();
            if (planKey == "free") continue;

            // Bỏ qua các gói dùng thử miễn phí 30 ngày do Admin cấp
            bool isTrial = sub.Term == "trial" || 
                           (sub.TermName != null && sub.TermName.ToLower().Contains("thử")) ||
                           (sub.Amount == 0 && (sub.Term == "trial" || (planKey == "pro" && sub.StartDate.AddDays(35) >= sub.EndDate)));

            if (isTrial) continue;

            if (planKey == "pro")
            {
                mrr += 59000;
            }
            else if (planKey == "business")
            {
                mrr += 166000;
            }
            else if (planKey == "basic")
            {
                mrr += 79000;
            }
            else if (sub.Amount > 0)
            {
                mrr += sub.Amount;
            }
        }

        var quarterlyRevenue = mrr * 3;
        var yearlyRevenue = mrr * 12;

        return Ok(new AdminStatsDto
        {
            TotalUsers = totalUsers,
            TotalOrganizations = totalOrgs,
            TotalBarcodes = totalBarcodes,
            ActiveSubscriptions = activeSubs,
            PendingRequests = pendingReqs,
            MonthlyRevenue = mrr,
            Mrr = mrr,
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
                CreatedAt = u.CreatedAt
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
                Amount = 0
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
    public IActionResult GetReports()
    {
        if (!IsAdmin) return Forbid();
        return Ok(new { message = "Báo cáo doanh thu & tăng trưởng hệ thống sẵn sàng." });
    }

    [HttpGet("support")]
    public IActionResult GetSupport()
    {
        if (!IsAdmin) return Forbid();
        return Ok(new List<object>());
    }
}
