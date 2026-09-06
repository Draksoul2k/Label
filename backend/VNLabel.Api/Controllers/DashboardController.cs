using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Enums;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public DashboardController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var sub = await _context.Subscriptions
            .Where(s => s.OrgId == orgId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        var planKey = sub?.Plan ?? "free";
        var plan = await _context.SubscriptionPlans
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Key == planKey);

        var flags = plan != null
            ? JsonSerializer.Deserialize<Dictionary<string, bool>>(plan.FeatureFlagsJson) ?? new Dictionary<string, bool>()
            : new Dictionary<string, bool>();

        var productCount = await _context.BarcodeItems.CountAsync(b => b.OrgId == orgId);
        var memberCount = await _context.Users.CountAsync(u => u.OrgId == orgId);

        // Count barcodes created this current month
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var barcodesThisMonth = await _context.BarcodeItems.CountAsync(b => b.OrgId == orgId && b.CreatedAt >= startOfMonth);

        // Generate last 6 months history
        var usageHistory = new List<DashboardUsageHistoryDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = DateTime.UtcNow.AddMonths(-i);
            var mStart = new DateTime(mDate.Year, mDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = mStart.AddMonths(1);
            var mCount = await _context.BarcodeItems.CountAsync(b => b.OrgId == orgId && b.CreatedAt >= mStart && b.CreatedAt < mEnd);
            usageHistory.Add(new DashboardUsageHistoryDto
            {
                Month = mDate.ToString("yyyy-MM"),
                Count = mCount
            });
        }

        var recentBarcodes = await _context.BarcodeItems
            .Where(b => b.OrgId == orgId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .Select(b => new DashboardRecentBarcodeDto
            {
                Id = b.Id,
                Sku = b.Sku,
                Name = b.Name,
                BarcodeType = b.BarcodeType.ToString(),
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(new DashboardOverviewDto
        {
            Plan = planKey,
            PlanName = sub?.PlanName ?? "Free",
            PlanRenewsAt = sub?.EndDate,
            BarcodeLimit = plan?.BarcodeLimit ?? 50,
            ProductLimit = plan?.ProductLimit ?? 30,
            BarcodesThisMonth = barcodesThisMonth,
            ProductCount = productCount,
            MemberCount = memberCount,
            Features = flags,
            UsageHistory = usageHistory,
            RecentBarcodes = recentBarcodes
        });
    }
}
