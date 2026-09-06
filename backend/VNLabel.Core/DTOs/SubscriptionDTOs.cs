namespace VNLabel.Core.DTOs;

public class SubscriptionPlanDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Popular { get; set; }
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public int BarcodeLimit { get; set; }
    public int ProductLimit { get; set; }
    public int CsvRows { get; set; }
    public int MaxUsers { get; set; }
    public List<string> Types { get; set; } = new();
    public List<string> Features { get; set; } = new();
    public Dictionary<string, bool> FeatureFlags { get; set; } = new();
}

public class CurrentSubscriptionDto
{
    public Guid Id { get; set; }
    public string Plan { get; set; } = "free";
    public string PlanName { get; set; } = "Free";
    public string BillingCycle { get; set; } = "Monthly";
    public string Term { get; set; } = "month";
    public string TermName { get; set; } = "1 tháng";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "Active";
    public bool AutoRenew { get; set; } = true;
    public decimal Amount { get; set; }
    public int? DaysRemaining { get; set; }
    public string? PreviousPlan { get; set; }
    public string? PreviousPlanName { get; set; }
    public DateTime? PreviousEndDate { get; set; }
}

public class SubscriptionTermDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Months { get; set; }
    public Dictionary<string, decimal> Prices { get; set; } = new();
}

public class SupportContactDto
{
    public string ZaloOaName { get; set; } = "VNLabel";
    public string ZaloOaUrl { get; set; } = "https://zalo.me/2830743105912995038";
    public string ZaloOaId { get; set; } = "";
    public string Hotline { get; set; } = "0901555547";
    public string Email { get; set; } = "hotro@vnlabel.vn";
    public string WorkingHours { get; set; } = "8:00 – 17:00, Thứ 2 – Thứ 7";
}

public class PlanRequestBody
{
    public string Plan { get; set; } = "pro";
    public string Cycle { get; set; } = "month";
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class SubscriptionRequestDto
{
    public Guid Id { get; set; }
    public Guid OrgId { get; set; }
    public string? OrgName { get; set; }
    public string Plan { get; set; } = string.Empty;
    public string Cycle { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? Note { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Paid";
    public DateTime PaidAt { get; set; }
    public string? PdfUrl { get; set; }
}

public class DashboardUsageHistoryDto
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardRecentBarcodeDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BarcodeType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class DashboardOverviewDto
{
    public string Plan { get; set; } = "free";
    public string PlanName { get; set; } = "Free";
    public DateTime? PlanRenewsAt { get; set; }
    public int BarcodeLimit { get; set; }
    public int ProductLimit { get; set; }
    public int BarcodesThisMonth { get; set; }
    public int ProductCount { get; set; }
    public int MemberCount { get; set; }
    public Dictionary<string, bool> Features { get; set; } = new();
    public List<DashboardUsageHistoryDto> UsageHistory { get; set; } = new();
    public List<DashboardRecentBarcodeDto> RecentBarcodes { get; set; } = new();
}

