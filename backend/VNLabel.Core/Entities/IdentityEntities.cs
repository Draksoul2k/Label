using VNLabel.Core.Enums;

namespace VNLabel.Core.Entities;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<BarcodeItem> BarcodeItems { get; set; } = new List<BarcodeItem>();
    public ICollection<LabelTemplate> LabelTemplates { get; set; } = new List<LabelTemplate>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsSystemAdmin { get; set; } = false;
    public bool IsEmailVerified { get; set; } = false;
    public string? AvatarUrl { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
}
