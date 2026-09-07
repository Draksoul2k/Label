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
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers["Pragma"] = "no-cache";
        ctx.Context.Response.Headers["Expires"] = "0";
    }
});

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
            // Use regex to robustly parse passwords with special chars like '@'
            var match = System.Text.RegularExpressions.Regex.Match(
                connStr, 
                @"^postgres(?:ql)?://([^:]+):(.+)@([^:/]+)(?::(\d+))?/(.+)$", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            string username, password, host, database;
            int port = 5432;

            if (match.Success)
            {
                username = match.Groups[1].Value;
                password = Uri.UnescapeDataString(match.Groups[2].Value);
                host = match.Groups[3].Value;
                if (int.TryParse(match.Groups[4].Value, out var parsedPort)) port = parsedPort;
                database = match.Groups[5].Value.Split('?')[0];
            }
            else
            {
                var uri = new Uri(connStr);
                var userInfo = uri.UserInfo.Split(':');
                username = userInfo[0];
                password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                host = uri.Host;
                port = uri.Port > 0 ? uri.Port : 5432;
                database = uri.AbsolutePath.TrimStart('/');
            }

            // Supabase Direct Host IPv4 fix:
            // db.[ref].supabase.co is IPv6-only. Render is IPv4-only.
            // Automatically switch to Supabase IPv4 Pooler so connection never fails!
            if (host.StartsWith("db.") && host.EndsWith(".supabase.co"))
            {
                var projectRef = host.Substring(3, host.IndexOf(".supabase.co") - 3);
                host = "aws-0-ap-southeast-1.pooler.supabase.com";
                if (!username.Contains("."))
                {
                    username = $"{username}.{projectRef}";
                }
                Console.WriteLine($"--> [Database] Auto-routed Supabase IPv6 to IPv4 Pooler: {host} (User: {username})");
            }

            return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Warning] Failed to parse postgres URL, using raw: {ex.Message}");
        }
    }
    return connStr;
}
