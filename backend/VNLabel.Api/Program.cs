using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VNLabel.Api.Middleware;
using VNLabel.Core.Interfaces;
using VNLabel.Infrastructure.Data;
using VNLabel.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Support dynamic port for Render ($PORT) and local fallback (5043)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5043";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");


// 1. Add Services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HACODE API",
        Version = "v1",
        Description = "API Quản lý mã vạch & thiết kế nhãn in HACODE"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT Token theo định dạng: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 2. Database & Multi-tenancy (Supports PostgreSQL, Render Persistent Disk, and SQLite)
var rawConn = Environment.GetEnvironmentVariable("DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("DefaultConnection")
              ?? "Data Source=vnlabel.db";

bool isPostgres = rawConn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
               || rawConn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
               || rawConn.Contains("Host=", StringComparison.OrdinalIgnoreCase)
               || rawConn.Contains("Server=", StringComparison.OrdinalIgnoreCase);

string connectionString;
if (isPostgres)
{
    connectionString = ParsePostgresUrl(rawConn);
    Console.WriteLine("--> [Database] Using PostgreSQL Database!");
}
else
{
    // SQLite: Support Render Persistent Disk (/var/data or /data or DATA_DIR)
    var envDataDir = Environment.GetEnvironmentVariable("DATA_DIR");
    string dbDir = !string.IsNullOrEmpty(envDataDir) ? envDataDir
                 : Directory.Exists("/var/data") ? "/var/data"
                 : Directory.Exists("/data") ? "/data"
                 : "";

    if (!string.IsNullOrEmpty(dbDir) && !rawConn.Contains("/") && !rawConn.Contains("\\"))
    {
        Directory.CreateDirectory(dbDir);
        var dbFileName = rawConn.Replace("Data Source=", "").Trim();
        connectionString = $"Data Source={Path.Combine(dbDir, dbFileName)}";
        Console.WriteLine($"--> [Database] Using SQLite with Persistent Storage at: {connectionString}");
    }
    else
    {
        connectionString = rawConn;
        Console.WriteLine($"--> [Database] Using SQLite at: {connectionString}");
    }
}

builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IBarcodeRenderService, BarcodeRenderService>();
builder.Services.AddScoped<IPrintService, PrintService>();

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var tenantService = sp.GetRequiredService<ITenantService>();
    if (isPostgres)
    {
        options.UseNpgsql(connectionString, b => b.MigrationsAssembly("VNLabel.Infrastructure"));
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});

// 3. JWT Authentication (Consistent Keys across deploys)
var jwtKey = builder.Configuration["JwtSettings:SecretKey"] ?? "VNLabelSuperSecretKeyForJwtAuthenticationMustBeAtLeast32BytesLong!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "HACODE";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "HACODEApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 5. Initialize Database and Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var dataDirPath = Path.Combine(app.Environment.ContentRootPath, "..", "..", "data");
        if (!Directory.Exists(dataDirPath))
            dataDirPath = Path.Combine(Directory.GetCurrentDirectory(), "data");
        if (!Directory.Exists(dataDirPath))
            dataDirPath = Path.Combine(app.Environment.ContentRootPath, "data");

        await DbInitializer.SeedAsync(context, dataDirPath);
        Console.WriteLine("--> [Database] Seed completed successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [Database] Error seeding: {ex.Message}");
    }
}

// 6. Middleware Pipeline
if (app.Environment.IsDevelopment() || true) // Enable Swagger on Render for testing
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HACODE API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAll");

// Serve Angular Static Files
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

app.MapControllers();

// SPA Fallback to Angular index.html
app.MapFallbackToFile("index.html");

app.Run();

static string ParsePostgresUrl(string connStr)
{
    if (connStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        connStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(connStr);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo[0];
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');
            return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Prefer;Trust Server Certificate=true";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Warning] Failed to parse postgres URL, using raw: {ex.Message}");
        }
    }
    return connStr;
}
