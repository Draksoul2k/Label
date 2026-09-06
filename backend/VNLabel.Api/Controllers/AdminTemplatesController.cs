using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/admin/templates")]
[Authorize]
public class AdminTemplatesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IWebHostEnvironment _environment;

    public AdminTemplatesController(AppDbContext context, ITenantService tenantService, IWebHostEnvironment environment)
    {
        _context = context;
        _tenantService = tenantService;
        _environment = environment;
    }

    private bool IsAdmin => _tenantService.IsSystemAdmin || _tenantService.CurrentUserRole == "Owner";

    [HttpGet]
    public async Task<IActionResult> GetAdminTemplates()
    {
        if (!IsAdmin) return Forbid();

        var templates = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .Where(t => t.IsSystem)
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .Select(t => new LabelTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Category = t.Category,
                WidthMm = t.WidthMm,
                HeightMm = t.HeightMm,
                Shape = t.Shape,
                Background = t.Background,
                ElementsJson = t.ElementsJson,
                PrintSettingsJson = t.PrintSettingsJson,
                DataSourceJson = t.DataSourceJson,
                ThumbnailUrl = t.ThumbnailUrl,
                IsSystem = true,
                IsPublished = t.IsPublished,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpPost]
    public async Task<IActionResult> SaveSystemTemplate([FromBody] SaveSystemTemplateRequest request)
    {
        if (!IsAdmin) return Forbid();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Tên mẫu tem không được để trống", detail = "Tên mẫu tem không được để trống" });

        var category = string.IsNullOrWhiteSpace(request.Category) ? "general" : request.Category.Trim();
        var shape = string.IsNullOrWhiteSpace(request.Shape) ? "rect" : request.Shape.Trim();
        var background = string.IsNullOrWhiteSpace(request.Background) ? "#ffffff" : request.Background.Trim();
        var elementsJson = string.IsNullOrWhiteSpace(request.ElementsJson) ? "[]" : request.ElementsJson;
        var printSettingsJson = string.IsNullOrWhiteSpace(request.PrintSettingsJson) ? "{}" : request.PrintSettingsJson;
        var widthMm = request.WidthMm > 0 ? request.WidthMm : 40;
        var heightMm = request.HeightMm > 0 ? request.HeightMm : 30;

        LabelTemplate? tpl = null;
        if (request.Id.HasValue && request.Id != Guid.Empty)
        {
            tpl = await _context.LabelTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == request.Id.Value && t.IsSystem);
        }

        try
        {
            if (tpl != null)
            {
                tpl.Name = request.Name.Trim();
                tpl.Category = category;
                tpl.WidthMm = widthMm;
                tpl.HeightMm = heightMm;
                tpl.Shape = shape;
                tpl.Background = background;
                tpl.ElementsJson = elementsJson;
                tpl.PrintSettingsJson = printSettingsJson;
                tpl.DataSourceJson = request.DataSourceJson;
                tpl.ThumbnailUrl = request.ThumbnailUrl;
                tpl.Description = request.Description?.Trim();
                tpl.Tags = request.Tags?.Trim();
                tpl.IsPopular = request.IsPopular;
                tpl.IsPublished = request.IsActive;
                tpl.SortOrder = request.SortOrder;
                tpl.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                tpl = new LabelTemplate
                {
                    Id = request.Id ?? Guid.NewGuid(),
                    Name = request.Name.Trim(),
                    Category = category,
                    WidthMm = widthMm,
                    HeightMm = heightMm,
                    Shape = shape,
                    Background = background,
                    ElementsJson = elementsJson,
                    PrintSettingsJson = printSettingsJson,
                    DataSourceJson = request.DataSourceJson,
                    ThumbnailUrl = request.ThumbnailUrl,
                    Description = request.Description?.Trim(),
                    Tags = request.Tags?.Trim(),
                    IsPopular = request.IsPopular,
                    IsSystem = true,
                    IsPublished = request.IsActive,
                    SortOrder = request.SortOrder,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.LabelTemplates.AddAsync(tpl);
            }

            await _context.SaveChangesAsync();
            return Ok(tpl);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Lưu mẫu tem thất bại: " + ex.Message, detail = ex.InnerException?.Message ?? ex.Message });
        }
    }

    [HttpPut("{id}/published")]
    public async Task<IActionResult> SetPublished(Guid id, [FromBody] SetPublishedRequest request)
    {
        if (!IsAdmin) return Forbid();

        var tpl = await _context.LabelTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id && t.IsSystem);
        if (tpl == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        tpl.IsPublished = request.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cập nhật trạng thái xuất bản thành công", isPublished = tpl.IsPublished });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSystemTemplate(Guid id)
    {
        if (!IsAdmin) return Forbid();

        var tpl = await _context.LabelTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id && t.IsSystem);
        if (tpl == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        _context.LabelTemplates.Remove(tpl);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa mẫu tem hệ thống thành công" });
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchTemplates(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? size = null,
        [FromQuery] string? code = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sort = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        if (!IsAdmin) return Forbid();

        var query = _context.LabelTemplates
            .IgnoreQueryFilters()
            .Where(t => t.IsSystem)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(s) || t.Category.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status.Equals("draft", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => !t.IsPublished);
            else if (status.Equals("published", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => t.IsPublished);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(t => t.SortOrder)
            .ThenByDescending(t => t.CreatedAt)
            .Skip(Math.Max(0, (page - 1) * pageSize))
            .Take(Math.Max(1, pageSize))
            .Select(t => new LabelTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Category = t.Category,
                WidthMm = t.WidthMm,
                HeightMm = t.HeightMm,
                Shape = t.Shape,
                Background = t.Background,
                ElementsJson = t.ElementsJson,
                PrintSettingsJson = t.PrintSettingsJson,
                DataSourceJson = t.DataSourceJson,
                ThumbnailUrl = t.ThumbnailUrl,
                IsSystem = true,
                IsPublished = t.IsPublished,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(new { total, items });
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        if (!IsAdmin) return Forbid();

        var categories = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .Where(t => t.IsSystem)
            .Select(t => t.Category)
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }
}
