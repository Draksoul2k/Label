using VNLabel.Core.Enums;

namespace VNLabel.Core.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public ICollection<BarcodeItem> BarcodeItems { get; set; } = new List<BarcodeItem>();
}

public class BarcodeItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public BarcodeType BarcodeType { get; set; } = BarcodeType.Code128;
    public decimal Price { get; set; } = 0;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Organization? Organization { get; set; }
    public Category? Category { get; set; }
}
