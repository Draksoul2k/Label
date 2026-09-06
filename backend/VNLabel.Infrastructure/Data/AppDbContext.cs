using Microsoft.EntityFrameworkCore;
using VNLabel.Core.Entities;
using VNLabel.Core.Interfaces;

namespace VNLabel.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ITenantService? _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService? tenantService = null)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<BarcodeItem> BarcodeItems => Set<BarcodeItem>();
    public DbSet<LabelTemplate> LabelTemplates => Set<LabelTemplate>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionRequest> SubscriptionRequests => Set<SubscriptionRequest>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<FontItem> Fonts => Set<FontItem>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SubscriptionPlan primary key
        modelBuilder.Entity<SubscriptionPlan>()
            .HasKey(p => p.Key);

        // Indexes
        modelBuilder.Entity<Organization>()
            .HasIndex(o => o.Slug)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<BarcodeItem>()
            .HasIndex(b => new { b.OrgId, b.Sku })
            .IsUnique();

        modelBuilder.Entity<ApiKey>()
            .HasIndex(k => k.KeyPrefix);

        // Multi-tenant Global Query Filters
        if (_tenantService != null)
        {
            modelBuilder.Entity<BarcodeItem>().HasQueryFilter(b => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                b.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<Category>().HasQueryFilter(c => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                c.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<User>().HasQueryFilter(u => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                u.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<LabelTemplate>().HasQueryFilter(t => 
                t.IsSystem || 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                t.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<Subscription>().HasQueryFilter(s => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                s.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<SubscriptionRequest>().HasQueryFilter(r => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                r.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<Invoice>().HasQueryFilter(i => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                i.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<ApiKey>().HasQueryFilter(k => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                k.OrgId == _tenantService.CurrentOrgId);

            modelBuilder.Entity<ActivityLog>().HasQueryFilter(l => 
                _tenantService.IsSystemAdmin || 
                _tenantService.CurrentOrgId == null || 
                l.OrgId == _tenantService.CurrentOrgId);
        }
    }
}
