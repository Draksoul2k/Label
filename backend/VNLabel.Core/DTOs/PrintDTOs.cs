using VNLabel.Core.Models;

namespace VNLabel.Core.DTOs;

public class PrintItemInput
{
    public Guid BarcodeId { get; set; }
    public int Quantity { get; set; } = 1;
    public Dictionary<string, string>? CustomFields { get; set; }
}

public class PrintJobRequest
{
    public Guid TemplateId { get; set; }
    public List<PrintItemInput> Items { get; set; } = new();
    public PrinterSettings? PrinterSettings { get; set; }
    public int Dpi { get; set; } = 203; // 203 or 300
    public bool IncludeWatermark { get; set; } = false;
}

public class CompiledLabelDto
{
    public Guid BarcodeId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public List<DesignerElement> Elements { get; set; } = new();
}

public class PrintPreviewResponse
{
    public string TemplateName { get; set; } = string.Empty;
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public string Shape { get; set; } = "rect";
    public string Background { get; set; } = "#ffffff";
    public int TotalLabels { get; set; }
    public int TotalPages { get; set; }
    public PrinterSettings PrinterSettings { get; set; } = new();
    public List<CompiledLabelDto> Labels { get; set; } = new();
}

public class PrintJobDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public int LabelCount { get; set; }
    public string Format { get; set; } = "PDF"; // PDF, ZPL, Web
    public string Status { get; set; } = "Completed";
    public DateTime CreatedAt { get; set; }
}
