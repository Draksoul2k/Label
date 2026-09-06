namespace VNLabel.Core.DTOs;

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalOrganizations { get; set; }
    public int TotalBarcodes { get; set; }
    public int ActiveSubscriptions { get; set; }
    public int PendingRequests { get; set; }
    public decimal MonthlyRevenue { get; set; }
}

public class ApproveRequestBody
{
    public string? Cycle { get; set; }
    public string? StartDate { get; set; }
    public string? Note { get; set; }
}

public class RejectRequestBody
{
    public string Note { get; set; } = string.Empty;
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Member";
    public Guid OrgId { get; set; }
    public string OrgName { get; set; } = string.Empty;
    public string Plan { get; set; } = "free";
    public string PlanName { get; set; } = "Free";
    public DateTime? PlanEndDate { get; set; }
    public bool IsSystemAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminChangePlanRequest
{
    public string Plan { get; set; } = "pro";
    public string Cycle { get; set; } = "month";
    public string? StartDate { get; set; }
}

public class SaveSystemTemplateRequest
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public double WidthMm { get; set; } = 40;
    public double HeightMm { get; set; } = 30;
    public string Shape { get; set; } = "rect";
    public string Background { get; set; } = "#ffffff";
    public string ElementsJson { get; set; } = "[]";
    public string PrintSettingsJson { get; set; } = "{}";
    public string? DataSourceJson { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public bool IsPopular { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

public class SetPublishedRequest
{
    public bool IsActive { get; set; }
}
