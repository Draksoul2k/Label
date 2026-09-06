namespace VNLabel.Core.DTOs;

public class SaveDesignerTemplateRequest
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = "Mẫu tem mới";
    public string Category { get; set; } = "general";
    public double WidthMm { get; set; } = 40.0;
    public double HeightMm { get; set; } = 30.0;
    public string Shape { get; set; } = "rect"; // rect, rounded, ellipse
    public string Background { get; set; } = "#ffffff";
    public string ElementsJson { get; set; } = "[]";
    public string PrintSettingsJson { get; set; } = "{}";
    public string? DataSourceJson { get; set; }
    public string? ThumbnailUrl { get; set; }
}

public class CopyLibraryTemplateRequest
{
    public string? Name { get; set; }
}

public class LabelTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public string Shape { get; set; } = "rect";
    public string Background { get; set; } = "#ffffff";
    public string ElementsJson { get; set; } = "[]";
    public string PrintSettingsJson { get; set; } = "{}";
    public string? DataSourceJson { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsSystem { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TemplateCategoryDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TemplateLibraryResponse
{
    public List<LabelTemplateDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
