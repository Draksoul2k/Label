namespace VNLabel.Core.Entities;

public class ApiKey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty; // First 8 chars for display
    public string KeyHash { get; set; } = string.Empty; // BCrypt / SHA256 of the secret
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public Organization? Organization { get; set; }
}

public class FontItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string FamilyCss { get; set; } = string.Empty;
    public string Source { get; set; } = "Google"; // Google, System, Custom
    public string? FileUrl { get; set; }
    public string? FileFormat { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? GoogleFamily { get; set; }
    public string? Weights { get; set; } = "400,700";
    public string GroupLabel { get; set; } = "Phổ biến";
    public bool SupportsVietnamese { get; set; } = true;
    public string? Sample { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public User? User { get; set; }
}
