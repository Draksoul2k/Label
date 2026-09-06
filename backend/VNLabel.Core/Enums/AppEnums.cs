namespace VNLabel.Core.Enums;

public enum BarcodeType
{
    Code128,
    Code39,
    QrCode,
    EAN13
}

public enum UserRole
{
    Owner,
    Admin,
    Member
}

public enum SubscriptionStatus
{
    Active,
    Expired,
    Cancelled
}

public enum BillingCycle
{
    Monthly,
    Yearly,
    TwoYearly
}

public enum RequestStatus
{
    Pending,
    Approved,
    Rejected
}

public enum LabelShape
{
    Rect,
    Rounded,
    Ellipse
}
