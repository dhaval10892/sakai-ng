using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RestaurantSaas.Application.DTOs;
using RestaurantSaaS.Api.Middleware;
using RestaurantSaas.Infrastructure.DependencyInjection;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Domain.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // local dev only
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero,

            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentTenantService>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireSuperAdmin", p => p.RequireRole(AppRoles.SuperAdmin));
    options.AddPolicy("RequireTenantAdmin", p => p.RequireRole(AppRoles.Admin));
});

// controllers + swagger
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:1455",
                "https://localhost:1455",
                "http://127.0.0.1:4200",
                "https://127.0.0.1:4200",
                "http://127.0.0.1:1455",
                "https://127.0.0.1:1455"
            )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.MapGet("/", () => "API is running");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseMiddleware<ApiExceptionMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await dbContext.Database.MigrateAsync();
        await EnsureMenuItemStockColumnsAsync(dbContext);
        await EnsureBookingRequestsTableAsync(dbContext);
        await EnsurePaymentColumnsAsync(dbContext);
        await EnsureOrderItemDetailColumnsAsync(dbContext);
        await DbSeeder.SeedAsync(dbContext, userManager, roleManager);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Startup database error:");
        Console.WriteLine(ex.ToString());
        throw;
    }
}

app.Run();

static async Task EnsureMenuItemStockColumnsAsync(ApplicationDbContext dbContext)
{
    const string sql = """
        IF COL_LENGTH('MenuItems', 'StockQuantity') IS NULL
        BEGIN
            ALTER TABLE [MenuItems] ADD [StockQuantity] int NOT NULL CONSTRAINT [DF_MenuItems_StockQuantity_Runtime] DEFAULT(0);
        END

        IF COL_LENGTH('MenuItems', 'LowStockThreshold') IS NULL
        BEGIN
            ALTER TABLE [MenuItems] ADD [LowStockThreshold] int NOT NULL CONSTRAINT [DF_MenuItems_LowStockThreshold_Runtime] DEFAULT(5);
        END
        """;

    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
    catch (SqlException)
    {
        // The normal path is EF migration. This fallback only repairs drifted local databases.
    }
}

static async Task EnsureBookingRequestsTableAsync(ApplicationDbContext dbContext)
{
    const string sql = """
        IF OBJECT_ID('dbo.BookingRequests', 'U') IS NULL
        BEGIN
            CREATE TABLE [dbo].[BookingRequests](
                [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                [RestaurantId] INT NOT NULL,
                [TableNumber] NVARCHAR(20) NOT NULL,
                [GuestName] NVARCHAR(120) NOT NULL,
                [Phone] NVARCHAR(40) NOT NULL,
                [BookingDate] date NOT NULL,
                [BookingTime] NVARCHAR(20) NOT NULL,
                [Seats] INT NOT NULL,
                [Occasion] NVARCHAR(80) NOT NULL CONSTRAINT [DF_BookingRequests_Occasion] DEFAULT(''),
                [Arrangement] NVARCHAR(500) NOT NULL CONSTRAINT [DF_BookingRequests_Arrangement] DEFAULT(''),
                [Status] NVARCHAR(30) NOT NULL CONSTRAINT [DF_BookingRequests_Status] DEFAULT('Pending'),
                [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_BookingRequests_CreatedAt] DEFAULT SYSUTCDATETIME(),
                [CreatedBy] NVARCHAR(100) NULL,
                [UpdatedAt] datetime2 NULL,
                [UpdatedBy] NVARCHAR(100) NULL
            );
        END
        """;

    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
    catch (SqlException)
    {
        // Local fallback for drifted databases.
    }
}

static async Task EnsurePaymentColumnsAsync(ApplicationDbContext dbContext)
{
    const string sql = """
        IF COL_LENGTH('Payments', 'TipAmount') IS NULL
        BEGIN
            ALTER TABLE [Payments] ADD [TipAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_Payments_TipAmount_Runtime] DEFAULT(0);
        END

        IF COL_LENGTH('Payments', 'CashAmount') IS NULL
        BEGIN
            ALTER TABLE [Payments] ADD [CashAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_Payments_CashAmount_Runtime] DEFAULT(0);
        END

        IF COL_LENGTH('Payments', 'CardAmount') IS NULL
        BEGIN
            ALTER TABLE [Payments] ADD [CardAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_Payments_CardAmount_Runtime] DEFAULT(0);
        END

        IF COL_LENGTH('Payments', 'QrAmount') IS NULL
        BEGIN
            ALTER TABLE [Payments] ADD [QrAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_Payments_QrAmount_Runtime] DEFAULT(0);
        END
        """;

    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
    catch (SqlException)
    {
        // Local fallback for drifted databases.
    }
}

static async Task EnsureOrderItemDetailColumnsAsync(ApplicationDbContext dbContext)
{
    const string sql = """
        IF COL_LENGTH('OrderItems', 'SpecialInstructions') IS NULL
        BEGIN
            ALTER TABLE [OrderItems] ADD [SpecialInstructions] nvarchar(180) NOT NULL CONSTRAINT [DF_OrderItems_SpecialInstructions_Runtime] DEFAULT('');
        END
        """;

    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
    catch (SqlException)
    {
        // Local fallback for drifted databases.
    }
}
