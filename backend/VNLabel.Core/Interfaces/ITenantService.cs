namespace VNLabel.Core.Interfaces;

public interface ITenantService
{
    Guid? CurrentOrgId { get; }
    Guid? CurrentUserId { get; }
    string? CurrentUserRole { get; }
    bool IsSystemAdmin { get; }
    void SetTenant(Guid orgId, Guid userId, string role, bool isSystemAdmin);
}
