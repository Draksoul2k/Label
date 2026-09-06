using VNLabel.Core.Enums;

namespace VNLabel.Core.Entities;

public class SubscriptionPlan
{
    public string Key { get; set; } = string.Empty; // free, pro, business
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Popular { get; set; } = false;
    public decimal PriceMonthly { get; set; } = 0;
    public decimal PriceYearly { get; set; } = 0;
    public int BarcodeLimit { get; set; } = 50;
    public int ProductLimit { get; set; } = 30;
    public int CsvRows { get; set; } = 0;
    public int MaxUsers { get; set; } = 1;
    public string SupportedTypesJson { get; set; } = "[\"Code128\",\"QrCode\"]";
    public string FeaturesJson { get; set; } = "[]";
    public string FeatureFlagsJson { get; set; } = "{}";
}

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public string Plan { get; set; } = "free";
    public string PlanName { get; set; } = "Free";
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
    public string Term { get; set; } = "month";
    public string TermName { get; set; } = "1 tháng";
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddYears(10);
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public bool AutoRenew { get; set; } = true;
    public decimal Amount { get; set; } = 0;

    public Organization? Organization { get; set; }
}

public class SubscriptionRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public string Plan { get; set; } = "pro";
    public string Cycle { get; set; } = "month";
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? Note { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public Organization? Organization { get; set; }
}

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Paid";
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string? PdfUrl { get; set; }

    public Organization? Organization { get; set; }
    public Subscription? Subscription { get; set; }
}
