using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public CategoriesController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var categories = await _context.Categories
            .Where(c => c.OrgId == orgId)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                ProductCount = c.BarcodeItems.Count,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Tên danh mục không được để trống" });

        var name = request.Name.Trim();
        if (await _context.Categories.AnyAsync(c => c.OrgId == orgId && c.Name.ToLower() == name.ToLower()))
            return BadRequest(new { message = "Danh mục đã tồn tại" });

        var category = new Category
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            ProductCount = 0,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục" });

        var name = request.Name.Trim();
        if (category.Name.ToLower() != name.ToLower() && await _context.Categories.AnyAsync(c => c.OrgId == orgId && c.Name.ToLower() == name.ToLower()))
            return BadRequest(new { message = "Tên danh mục đã tồn tại" });

        category.Name = name;
        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var category = await _context.Categories.Include(c => c.BarcodeItems).FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục" });

        // Unlink products from category before deletion
        foreach (var item in category.BarcodeItems)
        {
            item.CategoryId = null;
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa danh mục thành công" });
    }
}
