using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;

namespace VNLabel.Api.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService, AppDbContext dbContext)
    {
        // 1. Check if authenticated via JWT Claims
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var orgIdClaim = context.User.FindFirst("orgId")?.Value;
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                              ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value 
                            ?? context.User.FindFirst("role")?.Value ?? "Member";
            var isAdminClaim = context.User.FindFirst("isAdmin")?.Value;

            if (Guid.TryParse(orgIdClaim, out var orgId) && Guid.TryParse(userIdClaim, out var userId))
            {
                bool isSystemAdmin = string.Equals(isAdminClaim, "True", StringComparison.OrdinalIgnoreCase);
                tenantService.SetTenant(orgId, userId, roleClaim, isSystemAdmin);
            }
        }
        // 2. Check if authenticated via X-API-Key Header
        else if (context.Request.Headers.TryGetValue("X-API-Key", out var apiKeyHeader))
        {
            var rawKey = apiKeyHeader.ToString();
            if (rawKey.Length >= 8)
            {
                var prefix = rawKey[..8];
                var keyItem = await dbContext.ApiKeys
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(k => k.KeyPrefix == prefix && k.IsActive);

                if (keyItem != null && (keyItem.ExpiresAt == null || keyItem.ExpiresAt > DateTime.UtcNow))
                {
                    if (BCrypt.Net.BCrypt.Verify(rawKey, keyItem.KeyHash))
                    {
                        keyItem.LastUsedAt = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync();
                        tenantService.SetTenant(keyItem.OrgId, Guid.Empty, "ApiKey", false);
                    }
                }
            }
        }

        await _next(context);
    }
}
