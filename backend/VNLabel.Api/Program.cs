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
        Title = "VNLabel API",
        Version = "v1",
        Description = "API Quản lý mã vạch & thiết kế nhãn in VNLabel"
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

// 2. Database & Multi-tenancy
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=vnlabel.db";
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IBarcodeRenderService, BarcodeRenderService>();
builder.Services.AddScoped<IPrintService, PrintService>();
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var tenantService = sp.GetRequiredService<ITenantService>();
    options.UseSqlite(connectionString);
});

// 3. JWT Authentication
var jwtKey = builder.Configuration["JwtSettings:SecretKey"] ?? "VNLabelSuperSecretKeyForJwtAuthenticationMustBeAtLeast32BytesLong!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "VNLabel";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "VNLabelApp";

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
        Console.WriteLine($"--> [Database] Error seeding data: {ex.Message}");
    }
}

// 6. HTTP Pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "VNLabel API v1");
    c.RoutePrefix = "swagger";
});

var frontendPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(frontendPath) || !File.Exists(Path.Combine(frontendPath, "index.html")))
    frontendPath = Path.Combine(app.Environment.ContentRootPath, "frontend");
if (!Directory.Exists(frontendPath) || !File.Exists(Path.Combine(frontendPath, "index.html")))
    frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "frontend");
if (!Directory.Exists(frontendPath) || !File.Exists(Path.Combine(frontendPath, "index.html")))
    frontendPath = Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend");

if (Directory.Exists(frontendPath))
{
    var fullFrontendPath = Path.GetFullPath(frontendPath);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(fullFrontendPath),
        RequestPath = ""
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(fullFrontendPath),
        RequestPath = ""
    });
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

app.MapControllers();

if (Directory.Exists(frontendPath))
{
    var fullFrontendPath = Path.GetFullPath(frontendPath);
    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(fullFrontendPath)
    });
}

app.Run();
