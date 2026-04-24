using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Common;
using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaas.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly CurrentTenantService _tenant;
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentUserService currentUserService, CurrentTenantService tenant)
    : base(options)
    {
        _currentUserService = currentUserService;
        _tenant = tenant;
    }

    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ApplicationUser> applicationUsers => Set<ApplicationUser>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Restaurant> Restaurants { get; set; }
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<AuditableEntity>();

        foreach (var entry in entries)
        {
            var username = _currentUserService.Username ?? "system";

            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = username;

            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedBy = username;
            }
        }
        foreach (var entry in ChangeTracker.Entries<IHasRestaurant>())
        {
            if (entry.State == EntityState.Added)
            {
                if (_tenant.RestaurantId.HasValue)
                {
                    entry.Entity.RestaurantId = _tenant.RestaurantId.Value;
                }
                else
                {
                    if (entry.Entity.RestaurantId == 0)
                        throw new Exception("RestaurantId is required.");
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
    public override int SaveChanges()
    {
        var entries = ChangeTracker.Entries<AuditableEntity>();

        foreach (var entry in entries)
        {
            var username = _currentUserService.Username ?? "system";

            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = username;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedBy = username;
            }
        }

        return base.SaveChanges();
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MenuItem>()
            .HasQueryFilter(x => !_tenant.RestaurantId.HasValue || x.RestaurantId == _tenant.RestaurantId);

        modelBuilder.Entity<Order>()
            .HasQueryFilter(x => !_tenant.RestaurantId.HasValue || x.RestaurantId == _tenant.RestaurantId);


        modelBuilder.Entity<RestaurantTable>()
            .HasQueryFilter(x => !_tenant.RestaurantId.HasValue || x.RestaurantId == _tenant.RestaurantId);

        modelBuilder.Entity<MenuCategory>()
            .HasQueryFilter(x => !_tenant.RestaurantId.HasValue || x.RestaurantId == _tenant.RestaurantId);

        modelBuilder.Entity<MenuCategory>(entity =>
        {
            entity.ToTable("MenuCategories");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasOne(x => x.Restaurant)
               .WithMany(r => r.Categories)
                .HasForeignKey(x => x.RestaurantId);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
   {
       entity.ToTable("ActivityLogs");
       entity.HasKey(x => x.Id);

       entity.Property(x => x.Action)
           .IsRequired()
           .HasMaxLength(100);

       entity.Property(x => x.EntityName)
           .IsRequired()
           .HasMaxLength(100);

       entity.Property(x => x.EntityId)
           .IsRequired()
           .HasMaxLength(100);

       entity.Property(x => x.PerformedBy)
           .HasMaxLength(100);

       entity.Property(x => x.Details)
           .HasMaxLength(1000);
       entity.HasOne(x => x.Restaurant)
          .WithMany()
           .HasForeignKey(x => x.RestaurantId);
   });

        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.ToTable("MenuItems");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Price)
                .HasColumnType("decimal(18,2)");
            entity.Property(x => x.ImageUrl)
.HasMaxLength(500);

            entity.HasOne(x => x.MenuCategory)
                .WithMany(c => c.MenuItems)
                .HasForeignKey(x => x.MenuCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Restaurant)
                   .WithMany(r => r.MenuItems)
                   .HasForeignKey(x => x.RestaurantId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RestaurantTable>(entity =>
        {
            entity.ToTable("RestaurantTables");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Number)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasOne(x => x.Restaurant)
    .WithMany(r => r.Tables)
    .HasForeignKey(x => x.RestaurantId);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Table)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(x => x.Total)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(x => x.Restaurant)
                .WithMany(r => r.Orders)
                .HasForeignKey(x => x.RestaurantId);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.UnitPrice)
                .HasColumnType("decimal(18,2)");

            entity.Property(x => x.TotalPrice)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(x => x.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.MenuItem)
                .WithMany(m => m.OrderItems)
                .HasForeignKey(x => x.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Payment>(entity =>
{
    entity.ToTable("Payments");
    entity.HasKey(x => x.Id);

    entity.Property(x => x.Amount)
        .HasColumnType("decimal(18,2)");

    entity.Property(x => x.PaymentMethod)
        .IsRequired()
        .HasMaxLength(50);

    entity.Property(x => x.PaymentStatus)
        .IsRequired()
        .HasMaxLength(50);

    entity.HasOne(x => x.Order)
        .WithOne(o => o.Payment)
        .HasForeignKey<Payment>(x => x.OrderId)
        .OnDelete(DeleteBehavior.Cascade);
});

        modelBuilder.Entity<ApplicationUser>(entity =>
     {
         entity.Property(x => x.DisplayName)
             .HasMaxLength(150);

         entity.Property(x => x.IsActive)
             .IsRequired()
             .HasDefaultValue(true);
         entity.HasOne(x => x.Restaurant)
     .WithMany()
     .HasForeignKey(x => x.RestaurantId)
     .OnDelete(DeleteBehavior.Restrict);
     entity.HasOne(u => u.Restaurant)
    .WithMany(r => r.Users)
    .HasForeignKey(u => u.RestaurantId)
    .OnDelete(DeleteBehavior.Restrict);
         entity.HasQueryFilter(u =>
             _tenant.RestaurantId == null
             || u.RestaurantId == _tenant.RestaurantId);
     });
    }
}