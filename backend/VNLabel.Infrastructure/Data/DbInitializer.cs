using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using VNLabel.Core.Entities;
using VNLabel.Core.Enums;

namespace VNLabel.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context, string dataDirPath)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Subscription Plans
        if (!await context.SubscriptionPlans.AnyAsync())
        {
            var plans = new List<SubscriptionPlan>
            {
                new()
                {
                    Key = "free",
                    Name = "Free",
                    Description = "Dùng thử, phù hợp cá nhân mới bắt đầu.",
                    Popular = false,
                    PriceMonthly = 0,
                    PriceYearly = 0,
                    BarcodeLimit = 50,
                    ProductLimit = 30,
                    CsvRows = 0,
                    MaxUsers = 1,
                    SupportedTypesJson = "[\"Code128\",\"QrCode\"]",
                    FeaturesJson = "[\"50 mã vạch / tháng\",\"30 sản phẩm\"]",
                    FeatureFlagsJson = JsonSerializer.Serialize(new Dictionary<string, bool>
                    {
                        ["bulkUpload"] = false, ["backgroundJob"] = false, ["pdfExport"] = false,
                        ["templates"] = false, ["logoBranding"] = false, ["zplExport"] = false,
                        ["directPrint"] = true, ["watermark"] = true, ["subAccounts"] = false,
                        ["categories"] = false, ["history"] = true, ["usageHistory"] = false,
                        ["api"] = false, ["activityLog"] = false, ["designer"] = false,
                        ["systemTemplates"] = false, ["products"] = false
                    })
                },
                new()
                {
                    Key = "pro",
                    Name = "Pro",
                    Description = "Dành cho cửa hàng, doanh nghiệp vừa và nhỏ.",
                    Popular = true,
                    PriceMonthly = 59000,
                    PriceYearly = 699000,
                    BarcodeLimit = 5000,
                    ProductLimit = 999999,
                    CsvRows = 5000,
                    MaxUsers = 10,
                    SupportedTypesJson = "[\"Code128\",\"Code39\",\"QrCode\"]",
                    FeaturesJson = "[\"5.000 mã vạch / tháng\",\"Không giới hạn sản phẩm\",\"Tối đa 10 nhân viên\",\"Xuất PDF & ZPL\"]",
                    FeatureFlagsJson = JsonSerializer.Serialize(new Dictionary<string, bool>
                    {
                        ["bulkUpload"] = true, ["backgroundJob"] = true, ["pdfExport"] = true,
                        ["templates"] = true, ["logoBranding"] = true, ["zplExport"] = true,
                        ["directPrint"] = true, ["watermark"] = false, ["subAccounts"] = true,
                        ["categories"] = true, ["history"] = true, ["usageHistory"] = true,
                        ["api"] = false, ["activityLog"] = false, ["designer"] = true,
                        ["systemTemplates"] = false, ["products"] = true
                    })
                },
                new()
                {
                    Key = "business",
                    Name = "Business",
                    Description = "Dành cho chuỗi bán lẻ, xưởng in công nghiệp.",
                    Popular = false,
                    PriceMonthly = 166000,
                    PriceYearly = 1990000,
                    BarcodeLimit = 100000,
                    ProductLimit = 999999,
                    CsvRows = 50000,
                    MaxUsers = -1,
                    SupportedTypesJson = "[\"Code128\",\"Code39\",\"QrCode\"]",
                    FeaturesJson = "[\"100.000 mã vạch / tháng\",\"Không giới hạn nhân viên\",\"Tích hợp API Key\",\"Kho mẫu toàn diện\"]",
                    FeatureFlagsJson = JsonSerializer.Serialize(new Dictionary<string, bool>
                    {
                        ["bulkUpload"] = true, ["backgroundJob"] = true, ["pdfExport"] = true,
                        ["templates"] = true, ["logoBranding"] = true, ["zplExport"] = true,
                        ["directPrint"] = true, ["watermark"] = false, ["subAccounts"] = true,
                        ["categories"] = true, ["history"] = true, ["usageHistory"] = true,
                        ["api"] = true, ["activityLog"] = true, ["designer"] = true,
                        ["systemTemplates"] = true, ["products"] = true
                    })
                }
            };

            await context.SubscriptionPlans.AddRangeAsync(plans);
            await context.SaveChangesAsync();
        }

        // 2. Seed System Fonts
        if (!await context.Fonts.AnyAsync())
        {
            var defaultFonts = new List<FontItem>
            {
                new() { Name = "Arial", FamilyCss = "Arial", Source = "System", GroupLabel = "Phổ biến", SupportsVietnamese = true, SortOrder = 1 },
                new() { Name = "Times New Roman", FamilyCss = "Times New Roman", Source = "System", GroupLabel = "Phổ biến", SupportsVietnamese = true, SortOrder = 2 },
                new() { Name = "Courier New", FamilyCss = "Courier New", Source = "System", GroupLabel = "Phổ biến", SupportsVietnamese = true, SortOrder = 3 },
                new() { Name = "Verdana", FamilyCss = "Verdana", Source = "System", GroupLabel = "Phổ biến", SupportsVietnamese = true, SortOrder = 4 },
                new() { Name = "Roboto", FamilyCss = "Roboto", GoogleFamily = "Roboto", Source = "Google", GroupLabel = "Google Fonts", SupportsVietnamese = true, SortOrder = 5 },
                new() { Name = "Montserrat", FamilyCss = "Montserrat", GoogleFamily = "Montserrat", Source = "Google", GroupLabel = "Google Fonts", SupportsVietnamese = true, SortOrder = 6 },
                new() { Name = "Inter", FamilyCss = "Inter", GoogleFamily = "Inter", Source = "Google", GroupLabel = "Google Fonts", SupportsVietnamese = true, SortOrder = 7 }
            };

            await context.Fonts.AddRangeAsync(defaultFonts);
            await context.SaveChangesAsync();
        }

        // 3. Seed 24 System Templates from Dump
        if (!await context.LabelTemplates.AnyAsync(t => t.IsSystem))
        {
            var dumpPath = Path.Combine(dataDirPath, "full_system_dump.json");
            if (File.Exists(dumpPath))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(dumpPath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("templates_library", out var tplLib) &&
                        tplLib.TryGetProperty("items", out var items))
                    {
                        var templates = new List<LabelTemplate>();
                        foreach (var el in items.EnumerateArray())
                        {
                            var tpl = new LabelTemplate
                            {
                                Id = el.TryGetProperty("id", out var idProp) && Guid.TryParse(idProp.GetString(), out var gId) ? gId : Guid.NewGuid(),
                                Name = el.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "Mẫu tem",
                                Category = el.TryGetProperty("category", out var c) ? c.GetString() ?? "general" : "general",
                                WidthMm = el.TryGetProperty("widthMm", out var w) ? w.GetDouble() : 40,
                                HeightMm = el.TryGetProperty("heightMm", out var h) ? h.GetDouble() : 30,
                                Shape = el.TryGetProperty("shape", out var sh) ? sh.GetString() ?? "rect" : "rect",
                                Background = el.TryGetProperty("background", out var bg) ? bg.GetString() ?? "#ffffff" : "#ffffff",
                                ElementsJson = el.TryGetProperty("elementsJson", out var ej) ? ej.GetString() ?? "[]" : "[]",
                                PrintSettingsJson = el.TryGetProperty("printSettingsJson", out var ps) ? ps.GetString() ?? "{}" : "{}",
                                DataSourceJson = el.TryGetProperty("dataSourceJson", out var ds) ? ds.GetString() : null,
                                ThumbnailUrl = el.TryGetProperty("thumbnailUrl", out var th) ? th.GetString() : null,
                                IsSystem = true,
                                IsPublished = true,
                                SortOrder = 0
                            };
                            templates.Add(tpl);
                        }

                        if (templates.Count > 0)
                        {
                            await context.LabelTemplates.AddRangeAsync(templates);
                            await context.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DbInitializer] Error loading system templates: {ex.Message}");
                }
            }
        }

        // 4. Seed Demo Account matching the user's provided credentials
        if (!await context.Users.AnyAsync(u => u.Email == "test@gmail.com"))
        {
            var org = new Organization
            {
                Id = Guid.Parse("6648948e-943c-4373-8095-54bfebd8123f"),
                Name = "Cty ACB",
                Slug = "cty-acb",
                CreatedAt = DateTime.UtcNow
            };

            var user = new User
            {
                Id = Guid.Parse("2ce5db8c-72c1-44a5-9141-ed3a80238489"),
                OrgId = org.Id,
                Email = "test@gmail.com",
                Phone = "0874845488",
                Name = "Nguyễn Xuân Nam",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678"),
                Role = UserRole.Owner,
                IsSystemAdmin = false,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            var sub = new Subscription
            {
                Id = Guid.NewGuid(),
                OrgId = org.Id,
                Plan = "free",
                PlanName = "Free",
                BillingCycle = BillingCycle.Monthly,
                Term = "month",
                TermName = "1 tháng",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddYears(10),
                Status = SubscriptionStatus.Active,
                AutoRenew = true,
                Amount = 0
            };

            // Admin account
            var adminOrg = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "Hacode System Admin",
                Slug = "hacode-admin",
                CreatedAt = DateTime.UtcNow
            };

            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                OrgId = adminOrg.Id,
                Email = "admin@hacode.vn",
                Phone = "0901555547",
                Name = "Quản Trị Viên Hệ Thống",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                Role = UserRole.Owner,
                IsSystemAdmin = true,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            var adminSub = new Subscription
            {
                Id = Guid.NewGuid(),
                OrgId = adminOrg.Id,
                Plan = "business",
                PlanName = "Business Pro",
                BillingCycle = BillingCycle.Yearly,
                Term = "lifetime",
                TermName = "Trọn đời",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddYears(100),
                Status = SubscriptionStatus.Active,
                AutoRenew = true,
                Amount = 1990000
            };

            await context.Organizations.AddRangeAsync(org, adminOrg);
            await context.Users.AddRangeAsync(user, adminUser);
            await context.Subscriptions.AddRangeAsync(sub, adminSub);
            await context.SaveChangesAsync();
        }

        // 5. Ensure admin@hacode.vn is always configured and active
        var existingAdmin = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == "admin@hacode.vn" || u.Email == "admin@vnlabel.vn");

        if (existingAdmin != null)
        {
            existingAdmin.Email = "admin@hacode.vn";
            existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456");
            existingAdmin.IsSystemAdmin = true;
            existingAdmin.Role = UserRole.Owner;
            existingAdmin.IsEmailVerified = true;

            var existingAdminSub = await context.Subscriptions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.OrgId == existingAdmin.OrgId);

            if (existingAdminSub == null)
            {
                await context.Subscriptions.AddAsync(new Subscription
                {
                    Id = Guid.NewGuid(),
                    OrgId = existingAdmin.OrgId,
                    Plan = "business",
                    PlanName = "Business Pro",
                    BillingCycle = BillingCycle.Yearly,
                    Term = "lifetime",
                    TermName = "Trọn đời",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddYears(100),
                    Status = SubscriptionStatus.Active,
                    AutoRenew = true,
                    Amount = 1990000
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
