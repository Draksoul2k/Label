namespace VNLabel.Core.DTOs;

public class FontItemSummaryDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool SupportsVietnamese { get; set; } = true;
}

public class FontGroupDto
{
    public string Label { get; set; } = string.Empty;
    public List<FontItemSummaryDto> Fonts { get; set; } = new();
}

public class FontsResponse
{
    public List<FontGroupDto> Groups { get; set; } = new();
}

public class FontItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FamilyCss { get; set; } = string.Empty;
    public string Source { get; set; } = "Google";
    public string? FileUrl { get; set; }
    public string? FileFormat { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? GoogleFamily { get; set; }
    public string? Weights { get; set; }
    public string GroupLabel { get; set; } = "Phổ biến";
    public bool SupportsVietnamese { get; set; } = true;
    public string? Sample { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class SaveFontRequest
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FamilyCss { get; set; } = string.Empty;
    public string Source { get; set; } = "Google";
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
    public int SortOrder { get; set; }
}

public class SetFontActiveRequest
{
    public bool IsActive { get; set; }
}

public class ImportFontItem
{
    public string Family { get; set; } = string.Empty;
    public string GroupLabel { get; set; } = "Google Fonts";
    public bool SupportsVietnamese { get; set; } = true;
    public string? Note { get; set; }
}

public class ImportFontsRequest
{
    public List<ImportFontItem> Items { get; set; } = new();
}

public class RecognizeFontRequest
{
    public string? ImageUrl { get; set; }
    public string? ImageBase64 { get; set; }
}

public class RecognizeFontResponse
{
    public string RecognizedFont { get; set; } = "Arial";
    public double Confidence { get; set; } = 0.95;
    public List<string> Alternatives { get; set; } = new();
}
