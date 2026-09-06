using System.Text.Json;
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
public class SubscriptionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public SubscriptionsController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _context.SubscriptionPlans
            .IgnoreQueryFilters()
            .ToListAsync();

        var result = plans.Select(p =>
        {
            var types = JsonSerializer.Deserialize<List<string>>(p.SupportedTypesJson) ?? new List<string>();
            var features = JsonSerializer.Deserialize<List<string>>(p.FeaturesJson) ?? new List<string>();
            var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(p.FeatureFlagsJson) ?? new Dictionary<string, bool>();

            return new SubscriptionPlanDto
            {
                Key = p.Key,
                Name = p.Name,
                Description = p.Description,
                Popular = p.Popular,
                PriceMonthly = p.PriceMonthly,
                PriceYearly = p.PriceYearly,
                BarcodeLimit = p.BarcodeLimit,
                ProductLimit = p.ProductLimit,
                CsvRows = p.CsvRows,
                MaxUsers = p.MaxUsers,
                Types = types,
                Features = features,
                FeatureFlags = flags
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("terms")]
    [AllowAnonymous]
    public IActionResult GetTerms()
    {
        var terms = new List<SubscriptionTermDto>
        {
            new()
            {
                Key = "month",
                Name = "1 tháng",
                Months = 1,
                Prices = new Dictionary<string, decimal>
                {
                    ["pro"] = 59000,
                    ["business"] = 166000
                }
            },
            new()
            {
                Key = "year",
                Name = "1 năm",
                Months = 12,
                Prices = new Dictionary<string, decimal>
                {
                    ["pro"] = 699000,
                    ["business"] = 1990000
                }
            },
            new()
            {
                Key = "2year",
                Name = "2 năm",
                Months = 24,
                Prices = new Dictionary<string, decimal>
                {
                    ["pro"] = 1398000,
                    ["business"] = 3980000
                }
            }
        };

        return Ok(terms);
    }

    [HttpGet("contact")]
    [AllowAnonymous]
    public IActionResult GetContact()
    {
        return Ok(new SupportContactDto());
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSubscription()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var sub = await _context.Subscriptions
            .Where(s => s.OrgId == orgId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        if (sub == null)
        {
            return Ok(new CurrentSubscriptionDto
            {
                Id = Guid.Empty,
                Plan = "free",
                PlanName = "Free",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddYears(10)
            });
        }

        var daysRemaining = (int)Math.Max(0, (sub.EndDate - DateTime.UtcNow).TotalDays);

        return Ok(new CurrentSubscriptionDto
        {
            Id = sub.Id,
            Plan = sub.Plan,
            PlanName = sub.PlanName,
            BillingCycle = sub.BillingCycle.ToString(),
            Term = sub.Term,
            TermName = sub.TermName,
            StartDate = sub.StartDate,
            EndDate = sub.EndDate,
            Status = sub.Status.ToString(),
            AutoRenew = sub.AutoRenew,
            Amount = sub.Amount,
            DaysRemaining = daysRemaining
        });
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateSubscriptionRequest([FromBody] PlanRequestBody body)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var org = await _context.Organizations.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Id == orgId);

        var request = new SubscriptionRequest
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Plan = body.Plan,
            Cycle = body.Cycle,
            ContactName = string.IsNullOrWhiteSpace(body.ContactName) ? (org?.Name ?? "Khách hàng") : body.ContactName.Trim(),
            ContactPhone = body.ContactPhone.Trim(),
            Note = body.Note?.Trim(),
            Status = RequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _context.SubscriptionRequests.AddAsync(request);
        await _context.SaveChangesAsync();

        return Ok(new SubscriptionRequestDto
        {
            Id = request.Id,
            OrgId = request.OrgId,
            OrgName = org?.Name,
            Plan = request.Plan,
            Cycle = request.Cycle,
            ContactName = request.ContactName,
            ContactPhone = request.ContactPhone,
            Status = request.Status.ToString(),
            Note = request.Note,
            CreatedAt = request.CreatedAt
        });
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var requests = await _context.SubscriptionRequests
            .Where(r => r.OrgId == orgId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SubscriptionRequestDto
            {
                Id = r.Id,
                OrgId = r.OrgId,
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

    [HttpPost("requests/{id}/cancel")]
    public async Task<IActionResult> CancelRequest(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var req = await _context.SubscriptionRequests.FirstOrDefaultAsync(r => r.Id == id && r.OrgId == orgId);
        if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu" });

        if (req.Status != RequestStatus.Pending)
            return BadRequest(new { message = "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt" });

        _context.SubscriptionRequests.Remove(req);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã hủy yêu cầu thành công" });
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var invoices = await _context.Invoices
            .Where(i => i.OrgId == orgId)
            .OrderByDescending(i => i.PaidAt)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                Amount = i.Amount,
                Status = i.Status,
                PaidAt = i.PaidAt,
                PdfUrl = i.PdfUrl
            })
            .ToListAsync();

        return Ok(invoices);
    }
}
