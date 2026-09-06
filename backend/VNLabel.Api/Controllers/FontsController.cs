using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.DTOs;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FontsController : ControllerBase
{
    private readonly AppDbContext _context;

    public FontsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous] // Public for designer font picker
    public async Task<IActionResult> GetFonts()
    {
        var fonts = await _context.Fonts
            .IgnoreQueryFilters()
            .Where(f => f.IsActive)
            .OrderBy(f => f.SortOrder)
            .ThenBy(f => f.Name)
            .ToListAsync();

        var groups = fonts
            .GroupBy(f => f.GroupLabel)
            .Select(g => new FontGroupDto
            {
                Label = g.Key,
                Fonts = g.Select(f => new FontItemSummaryDto
                {
                    Label = f.Name,
                    Value = f.FamilyCss,
                    SupportsVietnamese = f.SupportsVietnamese
                }).ToList()
            })
            .ToList();

        return Ok(new FontsResponse { Groups = groups });
    }
}
