using System.Text;
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
public class BarcodesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IBarcodeRenderService _renderService;

    public BarcodesController(AppDbContext context, ITenantService tenantService, IBarcodeRenderService renderService)
    {
        _context = context;
        _tenantService = tenantService;
        _renderService = renderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBarcodes([FromQuery] string? q, [FromQuery] Guid? categoryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var query = _context.BarcodeItems
            .Where(b => b.OrgId == orgId)
            .Include(b => b.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLowerInvariant();
            query = query.Where(b => b.Sku.ToLower().Contains(search) || b.Name.ToLower().Contains(search));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(b => b.CategoryId == categoryId.Value);
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BarcodeItemDto
            {
                Id = b.Id,
                Sku = b.Sku,
                Name = b.Name,
                BarcodeType = b.BarcodeType.ToString(),
                Price = b.Price,
                Description = b.Description,
                CategoryId = b.CategoryId,
                CategoryName = b.Category != null ? b.Category.Name : null,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(new BarcodePagedResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBarcode(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var item = await _context.BarcodeItems
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == id && b.OrgId == orgId);

        if (item == null) return NotFound(new { message = "Không tìm thấy mã vạch" });

        return Ok(new BarcodeItemDto
        {
            Id = item.Id,
            Sku = item.Sku,
            Name = item.Name,
            BarcodeType = item.BarcodeType.ToString(),
            Price = item.Price,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateBarcode([FromBody] CreateBarcodeItemRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Sku) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Mã SKU và Tên sản phẩm không được để trống" });

        var sku = request.Sku.Trim();
        if (await _context.BarcodeItems.AnyAsync(b => b.OrgId == orgId && b.Sku.ToLower() == sku.ToLower()))
            return BadRequest(new { message = $"Mã SKU '{sku}' đã tồn tại trong tổ chức" });

        // Check plan product quota
        var currentCount = await _context.BarcodeItems.CountAsync(b => b.OrgId == orgId);
        var sub = await _context.Subscriptions.FirstOrDefaultAsync(s => s.OrgId == orgId && s.Status == SubscriptionStatus.Active);
        var planKey = sub?.Plan ?? "free";
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Key == planKey);

        if (plan != null && plan.ProductLimit > 0 && currentCount >= plan.ProductLimit)
        {
            return BadRequest(new { message = $"Gói cước {plan.Name} chỉ cho phép tối đa {plan.ProductLimit} sản phẩm. Vui lòng nâng cấp gói để tiếp tục thêm mới." });
        }

        var item = new BarcodeItem
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Sku = sku,
            Name = request.Name.Trim(),
            BarcodeType = request.BarcodeType,
            Price = request.Price,
            Description = request.Description?.Trim(),
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.BarcodeItems.AddAsync(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBarcode), new { id = item.Id }, new BarcodeItemDto
        {
            Id = item.Id,
            Sku = item.Sku,
            Name = item.Name,
            BarcodeType = item.BarcodeType.ToString(),
            Price = item.Price,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBarcode(Guid id, [FromBody] UpdateBarcodeItemRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var item = await _context.BarcodeItems.FirstOrDefaultAsync(b => b.Id == id && b.OrgId == orgId);
        if (item == null) return NotFound(new { message = "Không tìm thấy mã vạch" });

        var sku = request.Sku.Trim();
        if (item.Sku.ToLower() != sku.ToLower() && await _context.BarcodeItems.AnyAsync(b => b.OrgId == orgId && b.Sku.ToLower() == sku.ToLower()))
            return BadRequest(new { message = $"Mã SKU '{sku}' đã tồn tại trong tổ chức" });

        item.Sku = sku;
        item.Name = request.Name.Trim();
        item.BarcodeType = request.BarcodeType;
        item.Price = request.Price;
        item.Description = request.Description?.Trim();
        item.CategoryId = request.CategoryId;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new BarcodeItemDto
        {
            Id = item.Id,
            Sku = item.Sku,
            Name = item.Name,
            BarcodeType = item.BarcodeType.ToString(),
            Price = item.Price,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBarcode(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var item = await _context.BarcodeItems.FirstOrDefaultAsync(b => b.Id == id && b.OrgId == orgId);
        if (item == null) return NotFound(new { message = "Không tìm thấy mã vạch" });

        _context.BarcodeItems.Remove(item);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa mã vạch thành công" });
    }

    [HttpGet("{id}/render")]
    [AllowAnonymous] // Public render for images embedded in label previews
    public async Task<IActionResult> RenderBarcode(Guid id, [FromQuery] int width = 300, [FromQuery] int height = 100, [FromQuery] bool showText = true)
    {
        var item = await _context.BarcodeItems.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Id == id);
        if (item == null) return NotFound();

        var svg = _renderService.RenderSvg(item.Sku, item.BarcodeType, width, height, showText);
        return Content(svg, "image/svg+xml", Encoding.UTF8);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate([FromBody] BulkCreateRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (request.Rows == null || request.Rows.Count == 0)
            return BadRequest(new { message = "Danh sách sản phẩm trống" });

        var successCount = 0;
        var errors = new List<string>();

        // Load existing SKUs to avoid duplicates
        var existingSkus = await _context.BarcodeItems
            .Where(b => b.OrgId == orgId)
            .Select(b => b.Sku.ToLower())
            .ToListAsync();

        var existingSkuSet = new HashSet<string>(existingSkus);
        var categories = await _context.Categories.Where(c => c.OrgId == orgId).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Name.ToLower(), c => c.Id);

        var newItems = new List<BarcodeItem>();

        foreach (var (row, idx) in request.Rows.Select((r, i) => (r, i + 1)))
        {
            if (string.IsNullOrWhiteSpace(row.Sku) || string.IsNullOrWhiteSpace(row.Name))
            {
                errors.Add($"Dòng {idx}: SKU hoặc Tên sản phẩm không được để trống");
                continue;
            }

            var skuLower = row.Sku.Trim().ToLower();
            if (existingSkuSet.Contains(skuLower))
            {
                errors.Add($"Dòng {idx}: SKU '{row.Sku}' đã tồn tại");
                continue;
            }

            existingSkuSet.Add(skuLower);

            Guid? catId = null;
            if (!string.IsNullOrWhiteSpace(row.Category))
            {
                var catName = row.Category.Trim();
                if (!categoryMap.TryGetValue(catName.ToLower(), out var foundCatId))
                {
                    var newCat = new Category
                    {
                        Id = Guid.NewGuid(),
                        OrgId = orgId.Value,
                        Name = catName
                    };
                    await _context.Categories.AddAsync(newCat);
                    categoryMap[catName.ToLower()] = newCat.Id;
                    catId = newCat.Id;
                }
                else
                {
                    catId = foundCatId;
                }
            }

            var barcodeType = Enum.TryParse<BarcodeType>(row.BarcodeType, true, out var bt) ? bt : BarcodeType.Code128;

            newItems.Add(new BarcodeItem
            {
                Id = Guid.NewGuid(),
                OrgId = orgId.Value,
                Sku = row.Sku.Trim(),
                Name = row.Name.Trim(),
                BarcodeType = barcodeType,
                Price = row.Price,
                Description = row.Description?.Trim(),
                CategoryId = catId,
                CreatedAt = DateTime.UtcNow
            });

            successCount++;
        }

        if (newItems.Count > 0)
        {
            await _context.BarcodeItems.AddRangeAsync(newItems);
            await _context.SaveChangesAsync();
        }

        return Ok(new BulkImportResult
        {
            SuccessCount = successCount,
            FailedCount = errors.Count,
            Errors = errors
        });
    }

    [HttpPost("bulk-import")]
    public async Task<IActionResult> BulkImport([FromBody] BulkImportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CsvContent))
            return BadRequest(new { message = "Nội dung CSV không được để trống" });

        var rows = new List<BulkBarcodeRow>();
        using var reader = new StringReader(request.CsvContent);
        string? line;
        var headerRead = false;

        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var parts = line.Split(',');

            if (!headerRead)
            {
                headerRead = true;
                continue; // Skip header
            }

            if (parts.Length >= 2)
            {
                var sku = parts[0].Trim();
                var name = parts[1].Trim();
                decimal price = 0;
                if (parts.Length >= 3) decimal.TryParse(parts[2].Trim(), out price);
                var category = parts.Length >= 4 ? parts[3].Trim() : null;

                rows.Add(new BulkBarcodeRow
                {
                    Sku = sku,
                    Name = name,
                    Price = price,
                    Category = category
                });
            }
        }

        return await BulkCreate(new BulkCreateRequest { Rows = rows });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var items = await _context.BarcodeItems
            .Where(b => b.OrgId == orgId)
            .Include(b => b.Category)
            .OrderBy(b => b.Sku)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("SKU,Name,Price,BarcodeType,Category,CreatedAt");
        foreach (var item in items)
        {
            sb.AppendLine($"\"{item.Sku}\",\"{item.Name}\",{item.Price},\"{item.BarcodeType}\",\"{item.Category?.Name}\",\"{item.CreatedAt:yyyy-MM-dd HH:mm:ss}\"");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"barcodes_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }
}
