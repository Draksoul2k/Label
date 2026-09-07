using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Interfaces;
using VNLabel.Core.Models;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/print")]
[Authorize]
public class PrintController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IPrintService _printService;

    public PrintController(AppDbContext context, ITenantService tenantService, IPrintService printService)
    {
        _context = context;
        _tenantService = tenantService;
        _printService = printService;
    }

    [HttpPost("preview")]
    public async Task<IActionResult> GetPrintPreview([FromBody] PrintJobRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var template = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && (t.IsSystem || t.OrgId == orgId));

        if (template == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        var compiledLabels = await BuildCompiledLabels(orgId.Value, template, request.Items);

        var settings = request.PrinterSettings ?? ParsePrinterSettings(template.PrintSettingsJson);
        var labelsPerPage = Math.Max(1, settings.Columns * settings.Rows);
        var totalPages = (int)Math.Ceiling(compiledLabels.Count / (double)labelsPerPage);

        return Ok(new PrintPreviewResponse
        {
            TemplateName = template.Name,
            WidthMm = template.WidthMm,
            HeightMm = template.HeightMm,
            Shape = template.Shape,
            Background = template.Background,
            TotalLabels = compiledLabels.Count,
            TotalPages = totalPages,
            PrinterSettings = settings,
            Labels = compiledLabels
        });
    }

    [HttpPost("zpl")]
    public async Task<IActionResult> GenerateZpl([FromBody] PrintJobRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var template = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && (t.IsSystem || t.OrgId == orgId));

        if (template == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        var isWatermark = await CheckWatermarkRequired(orgId.Value);
        var compiledLabels = await BuildCompiledLabels(orgId.Value, template, request.Items);

        if (!await CheckMonthlyPrintLimit(orgId.Value))
        {
            return BadRequest(new { 
                message = "Bạn đã dùng hết 20 lượt in của gói Free trong tháng này.", 
                detail = "Gói Free chỉ được in tối đa 20 lần mỗi tháng. Vui lòng liên hệ HACODE (0942.858.285) để trải nghiệm 30 ngày dùng thử miễn phí gói Pro!" 
            });
        }

        var settings = request.PrinterSettings ?? ParsePrinterSettings(template.PrintSettingsJson);

        var zpl = _printService.GenerateZpl(template, compiledLabels, settings, request.Dpi, isWatermark);
        var bytes = Encoding.UTF8.GetBytes(zpl);

        await RecordPrintActivity(orgId.Value, template.Name, compiledLabels.Count);
        return File(bytes, "text/plain", $"labels_{DateTime.UtcNow:yyyyMMdd_HHmmss}.zpl");
    }

    [HttpPost("html")]
    public async Task<IActionResult> GenerateHtml([FromBody] PrintJobRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var template = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && (t.IsSystem || t.OrgId == orgId));

        if (template == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        var isWatermark = await CheckWatermarkRequired(orgId.Value);
        var compiledLabels = await BuildCompiledLabels(orgId.Value, template, request.Items);

        if (!await CheckMonthlyPrintLimit(orgId.Value))
        {
            return BadRequest(new { 
                message = "Bạn đã dùng hết 20 lượt in của gói Free trong tháng này.", 
                detail = "Gói Free chỉ được in tối đa 20 lần mỗi tháng. Vui lòng liên hệ HACODE (0942.858.285) để trải nghiệm 30 ngày dùng thử miễn phí gói Pro!" 
            });
        }

        var settings = request.PrinterSettings ?? ParsePrinterSettings(template.PrintSettingsJson);

        var html = _printService.GenerateHtmlPrint(template, compiledLabels, settings, isWatermark);
        await RecordPrintActivity(orgId.Value, template.Name, compiledLabels.Count);
        return Content(html, "text/html", Encoding.UTF8);
    }

    [HttpPost("pdf")]
    public async Task<IActionResult> GeneratePdf([FromBody] PrintJobRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var template = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && (t.IsSystem || t.OrgId == orgId));

        if (template == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        var isWatermark = await CheckWatermarkRequired(orgId.Value);
        var compiledLabels = await BuildCompiledLabels(orgId.Value, template, request.Items);

        if (!await CheckMonthlyPrintLimit(orgId.Value))
        {
            return BadRequest(new { 
                message = "Bạn đã dùng hết 20 lượt in của gói Free trong tháng này.", 
                detail = "Gói Free chỉ được in tối đa 20 lần mỗi tháng. Vui lòng liên hệ HACODE (0942.858.285) để trải nghiệm 30 ngày dùng thử miễn phí gói Pro!" 
            });
        }

        var settings = request.PrinterSettings ?? ParsePrinterSettings(template.PrintSettingsJson);

        var pdfBytes = _printService.GeneratePdf(template, compiledLabels, settings, isWatermark);
        await RecordPrintActivity(orgId.Value, template.Name, compiledLabels.Count);
        return File(pdfBytes, "application/pdf", $"labels_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf");
    }

    [HttpGet("/api/print-jobs")]
    public async Task<IActionResult> GetPrintJobs()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        // Query active print jobs or recent activity
        var logs = await _context.ActivityLogs
            .Where(l => l.OrgId == orgId && l.Action.StartsWith("Print"))
            .OrderByDescending(l => l.CreatedAt)
            .Take(20)
            .Select(l => new PrintJobDto
            {
                Id = l.Id,
                TemplateName = l.Details ?? "In tem nhãn",
                LabelCount = 1,
                Format = "Web",
                Status = "Completed",
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }

    private async Task<List<CompiledLabelDto>> BuildCompiledLabels(Guid orgId, LabelTemplate template, List<PrintItemInput> items)
    {
        var result = new List<CompiledLabelDto>();
        var barcodeIds = items.Select(i => i.BarcodeId).Distinct().ToList();

        var products = await _context.BarcodeItems
            .Where(b => b.OrgId == orgId && barcodeIds.Contains(b.Id))
            .Include(b => b.Category)
            .ToDictionaryAsync(b => b.Id);

        foreach (var itemInput in items)
        {
            if (!products.TryGetValue(itemInput.BarcodeId, out var product)) continue;

            var qty = Math.Max(1, Math.Min(itemInput.Quantity, 5000)); // Cap to 5000 per line
            for (var i = 0; i < qty; i++)
            {
                var compiledElements = TemplateCompiler.CompileElements(template.ElementsJson, product, itemInput.CustomFields);

                result.Add(new CompiledLabelDto
                {
                    BarcodeId = product.Id,
                    Sku = product.Sku,
                    Name = product.Name,
                    Price = product.Price,
                    Elements = compiledElements
                });
            }
        }

        return result;
    }

    private async Task<bool> IsFreePlan(Guid orgId)
    {
        if (_tenantService.IsSystemAdmin) return false;
        var sub = await _context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrgId == orgId && s.Status == Core.Enums.SubscriptionStatus.Active);

        if (sub == null) return true;
        if (sub.EndDate < DateTime.UtcNow) return true;
        var planKey = (sub.Plan ?? "free").ToLowerInvariant();
        return planKey == "free";
    }

    private async Task<bool> CheckWatermarkRequired(Guid orgId)
    {
        return await IsFreePlan(orgId);
    }

    private async Task<bool> CheckMonthlyPrintLimit(Guid orgId)
    {
        if (await IsFreePlan(orgId))
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var printCount = await _context.ActivityLogs
                .Where(l => l.OrgId == orgId && l.Action.StartsWith("Print") && l.CreatedAt >= startOfMonth)
                .CountAsync();
            return printCount < 20;
        }
        return true;
    }

    private async Task RecordPrintActivity(Guid orgId, string templateName, int labelCount)
    {
        try
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                OrgId = orgId,
                UserId = _tenantService.CurrentUserId,
                Action = "Print",
                Details = $"In tem: {templateName} ({labelCount} tem)",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        catch { }
    }

    private static PrinterSettings ParsePrinterSettings(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new PrinterSettings();
        try
        {
            return JsonSerializer.Deserialize<PrinterSettings>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new PrinterSettings();
        }
        catch
        {
            return new PrinterSettings();
        }
    }
}
