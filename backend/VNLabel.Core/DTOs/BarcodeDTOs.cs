using VNLabel.Core.Enums;

namespace VNLabel.Core.DTOs;

public class CreateBarcodeItemRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public BarcodeType BarcodeType { get; set; } = BarcodeType.Code128;
    public decimal Price { get; set; } = 0;
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
}

public class UpdateBarcodeItemRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public BarcodeType BarcodeType { get; set; } = BarcodeType.Code128;
    public decimal Price { get; set; } = 0;
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
}

public class BarcodeItemDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BarcodeType { get; set; } = "Code128";
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BarcodePagedResponse
{
    public List<BarcodeItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalPages { get; set; }
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BulkBarcodeRow
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BarcodeType { get; set; } = "Code128";
    public decimal Price { get; set; } = 0;
    public string? Category { get; set; }
    public string? Description { get; set; }
}

public class BulkCreateRequest
{
    public List<BulkBarcodeRow> Rows { get; set; } = new();
}

public class BulkImportRequest
{
    public string CsvContent { get; set; } = string.Empty;
}

public class BulkImportResult
{
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
