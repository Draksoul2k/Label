using VNLabel.Core.Interfaces;

namespace VNLabel.Infrastructure.Services;

public class TenantService : ITenantService
{
    public Guid? CurrentOrgId { get; private set; }
    public Guid? CurrentUserId { get; private set; }
    public string? CurrentUserRole { get; private set; }
    public bool IsSystemAdmin { get; private set; }

    public void SetTenant(Guid orgId, Guid userId, string role, bool isSystemAdmin)
    {
        CurrentOrgId = orgId;
        CurrentUserId = userId;
        CurrentUserRole = role;
        IsSystemAdmin = isSystemAdmin;
    }
}
