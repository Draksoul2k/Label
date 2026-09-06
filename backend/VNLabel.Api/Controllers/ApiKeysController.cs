using System.Security.Cryptography;
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
public class ApiKeysController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public ApiKeysController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApiKeys()
    {
        if (!_tenantService.IsSystemAdmin) return Forbid();
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var keys = await _context.ApiKeys
            .Where(k => k.OrgId == orgId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                KeyPrefix = k.KeyPrefix,
                IsActive = k.IsActive,
                CreatedAt = k.CreatedAt,
                ExpiresAt = k.ExpiresAt,
                LastUsedAt = k.LastUsedAt
            })
            .ToListAsync();

        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        if (!_tenantService.IsSystemAdmin) return Forbid();
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Tên API Key không được để trống" });

        // Generate full key: vnl_ + 32 random characters
        var randomBytes = new byte[24];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var randomString = Convert.ToBase64String(randomBytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")[..32];

        var fullKey = $"vnl_{randomString}";
        var prefix = fullKey[..8]; // vnl_xxxx

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            OrgId = orgId.Value,
            Name = request.Name.Trim(),
            KeyPrefix = prefix,
            KeyHash = BCrypt.Net.BCrypt.HashPassword(fullKey),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.ApiKeys.AddAsync(apiKey);
        await _context.SaveChangesAsync();

        return Ok(new CreateApiKeyResponse
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            KeyPrefix = prefix,
            FullApiKey = fullKey,
            PlainKey = fullKey,
            CreatedAt = apiKey.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteApiKey(Guid id)
    {
        if (!_tenantService.IsSystemAdmin) return Forbid();
        var orgId = _tenantService.CurrentOrgId;
        if (orgId == null) return Unauthorized();

        var key = await _context.ApiKeys.FirstOrDefaultAsync(k => k.Id == id && k.OrgId == orgId);
        if (key == null) return NotFound(new { message = "Không tìm thấy API Key" });

        _context.ApiKeys.Remove(key);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa API Key thành công" });
    }
}
