using VNLabel.Core.Enums;

namespace VNLabel.Core.Entities;

public class LabelTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? OrgId { get; set; } // Null for system templates
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public double WidthMm { get; set; } = 40.0;
    public double HeightMm { get; set; } = 30.0;
    public string Shape { get; set; } = "rect"; // rect, rounded, ellipse
    public string Background { get; set; } = "#ffffff";
    public string ElementsJson { get; set; } = "[]";
    public string PrintSettingsJson { get; set; } = "{}";
    public string? DataSourceJson { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public bool IsPopular { get; set; } = false;
    public bool IsSystem { get; set; } = false;
    public bool IsPublished { get; set; } = true;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Organization? Organization { get; set; }
}
