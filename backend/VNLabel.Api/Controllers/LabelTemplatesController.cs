using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/label-templates")]
[Authorize]
public class LabelTemplatesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IWebHostEnvironment _environment;

    public LabelTemplatesController(AppDbContext context, ITenantService tenantService, IWebHostEnvironment environment)
    {
        _context = context;
        _tenantService = tenantService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTemplates()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var templates = await _context.LabelTemplates
            .Where(t => t.IsSystem || t.OrgId == orgId)
            .OrderByDescending(t => t.CreatedAt)
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
                IsSystem = t.IsSystem,
                IsPublished = t.IsPublished,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyTemplates()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var templates = await _context.LabelTemplates
            .Where(t => !t.IsSystem && t.OrgId == orgId)
            .OrderByDescending(t => t.CreatedAt)
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
                IsSystem = false,
                IsPublished = t.IsPublished,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("library")]
    [AllowAnonymous] // Anyone can view the system library
    public async Task<IActionResult> GetLibraryTemplates([FromQuery] string? category, [FromQuery] string? q)
    {
        var query = _context.LabelTemplates
            .IgnoreQueryFilters()
            .Where(t => t.IsSystem && t.IsPublished);

        if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
        {
            query = query.Where(t => t.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(search) || (t.Tags != null && t.Tags.ToLower().Contains(search)));
        }

        var items = await query
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

        return Ok(new TemplateLibraryResponse
        {
            Items = items,
            TotalCount = items.Count
        });
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categoryIcons = new Dictionary<string, (string Name, string Icon)>
        {
            ["address"] = ("Tem địa chỉ / Vận chuyển", "fa-truck"),
            ["asset"] = ("Tem tài sản", "fa-boxes-stacked"),
            ["barcode"] = ("Mã vạch chuẩn", "fa-barcode"),
            ["beverage"] = ("Đồ uống & Trà sữa", "fa-mug-hot"),
            ["book"] = ("Sách & Thư viện", "fa-book"),
            ["cosmetic"] = ("Mỹ phẩm", "fa-spa"),
            ["electronic"] = ("Điện tử & Thiết bị", "fa-microchip"),
            ["event"] = ("Sự kiện & Quà tặng", "fa-gift"),
            ["fashion"] = ("Thời trang & Thẻ bài", "fa-shirt"),
            ["food"] = ("Thực phẩm & Bánh kẹo", "fa-utensils"),
            ["fresh"] = ("Nông sản & Trái cây", "fa-apple-whole"),
            ["jewelry"] = ("Trang sức & Kính mắt", "fa-ring"),
            ["office"] = ("Văn phòng phẩm", "fa-folder-open"),
            ["pharma"] = ("Dược phẩm & Thuốc", "fa-pills"),
            ["price"] = ("Nhãn giá siêu thị", "fa-tag"),
            ["general"] = ("Mẫu thông dụng", "fa-layer-group")
        };

        var counts = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .Where(t => t.IsSystem && t.IsPublished)
            .GroupBy(t => t.Category.ToLower())
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync();

        var result = counts.Select(c =>
        {
            var (name, icon) = categoryIcons.TryGetValue(c.Key, out var val) ? val : (c.Key, "fa-tag");
            return new TemplateCategoryDto
            {
                Key = c.Key,
                Name = name,
                Icon = icon,
                Count = c.Count
            };
        }).OrderByDescending(c => c.Count).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemplate(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;

        var t = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id && (t.IsSystem || t.OrgId == orgId));

        if (t == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        return Ok(new LabelTemplateDto
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
            IsSystem = t.IsSystem,
            IsPublished = t.IsPublished,
            CreatedAt = t.CreatedAt
        });
    }

    [HttpPost("designer")]
    public async Task<IActionResult> SaveDesignerTemplate([FromBody] SaveDesignerTemplateRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        LabelTemplate? template = null;

        if (request.Id.HasValue && request.Id != Guid.Empty)
        {
            template = await _context.LabelTemplates.FirstOrDefaultAsync(t => t.Id == request.Id.Value && t.OrgId == orgId);
        }

        if (template != null)
        {
            // Update existing template
            template.Name = request.Name.Trim();
            template.Category = request.Category;
            template.WidthMm = request.WidthMm;
            template.HeightMm = request.HeightMm;
            template.Shape = request.Shape;
            template.Background = request.Background;
            template.ElementsJson = request.ElementsJson;
            template.PrintSettingsJson = request.PrintSettingsJson;
            template.DataSourceJson = request.DataSourceJson;
            if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
                template.ThumbnailUrl = request.ThumbnailUrl;
            template.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new template
            template = new LabelTemplate
            {
                Id = request.Id ?? Guid.NewGuid(),
                OrgId = orgId.Value,
                Name = request.Name.Trim(),
                Category = request.Category,
                WidthMm = request.WidthMm,
                HeightMm = request.HeightMm,
                Shape = request.Shape,
                Background = request.Background,
                ElementsJson = request.ElementsJson,
                PrintSettingsJson = request.PrintSettingsJson,
                DataSourceJson = request.DataSourceJson,
                ThumbnailUrl = request.ThumbnailUrl,
                IsSystem = false,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };
            await _context.LabelTemplates.AddAsync(template);
        }

        await _context.SaveChangesAsync();

        return Ok(new LabelTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Category = template.Category,
            WidthMm = template.WidthMm,
            HeightMm = template.HeightMm,
            Shape = template.Shape,
            Background = template.Background,
            ElementsJson = template.ElementsJson,
            PrintSettingsJson = template.PrintSettingsJson,
            DataSourceJson = template.DataSourceJson,
            ThumbnailUrl = template.ThumbnailUrl,
            IsSystem = false,
            IsPublished = true,
            CreatedAt = template.CreatedAt
        });
    }

    [HttpPost("library/{id}/copy")]
    public async Task<IActionResult> CopyLibraryTemplate(Guid id, [FromBody] CopyLibraryTemplateRequest? request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var source = await _context.LabelTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == id && t.IsSystem);

        if (source == null) return NotFound(new { message = "Không tìm thấy mẫu trong thư viện" });

        var copyName = !string.IsNullOrWhiteSpace(request?.Name) ? request.Name.Trim() : $"{source.Name} (Bản sao)";

        var copy = new LabelTemplate
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Name = copyName,
            Category = source.Category,
            WidthMm = source.WidthMm,
            HeightMm = source.HeightMm,
            Shape = source.Shape,
            Background = source.Background,
            ElementsJson = source.ElementsJson,
            PrintSettingsJson = source.PrintSettingsJson,
            DataSourceJson = source.DataSourceJson,
            ThumbnailUrl = source.ThumbnailUrl,
            IsSystem = false,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.LabelTemplates.AddAsync(copy);
        await _context.SaveChangesAsync();

        return Ok(new LabelTemplateDto
        {
            Id = copy.Id,
            Name = copy.Name,
            Category = copy.Category,
            WidthMm = copy.WidthMm,
            HeightMm = copy.HeightMm,
            Shape = copy.Shape,
            Background = copy.Background,
            ElementsJson = copy.ElementsJson,
            PrintSettingsJson = copy.PrintSettingsJson,
            DataSourceJson = copy.DataSourceJson,
            ThumbnailUrl = copy.ThumbnailUrl,
            IsSystem = false,
            IsPublished = true,
            CreatedAt = copy.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var template = await _context.LabelTemplates.FirstOrDefaultAsync(t => t.Id == id && t.OrgId == orgId && !t.IsSystem);
        if (template == null) return NotFound(new { message = "Không tìm thấy mẫu tem" });

        _context.LabelTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa mẫu tem thành công" });
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file hình ảnh hợp lệ" });

        var allowedExts = new[] { ".png", ".jpg", ".jpeg", ".svg", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExts.Contains(ext))
            return BadRequest(new { message = "Chỉ hỗ trợ file ảnh: PNG, JPG, JPEG, SVG, WEBP" });

        var uploadsDir = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "images");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/images/{fileName}";
        return Ok(new { url });
    }
}
