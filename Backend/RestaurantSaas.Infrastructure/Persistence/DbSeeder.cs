using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Domain.Common;
using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaas.Application.DTOs;

public static class DbSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // 1) Create roles (SaaS + existing)
        string[] roles =
        {
            AppRoles.SuperAdmin, AppRoles.Admin,
            AppRoles.Admin, AppRoles.Kitchen, AppRoles.Waiter, AppRoles.Billing
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // 2) Create Super Admin (no RestaurantId)
        var superAdmin = await CreateUserAsync(
            userManager,
            username: "superadmin",
            password: "superadmin123",
            role: AppRoles.SuperAdmin,
            displayName: "Super Admin",
            restaurantId: null
        );

        // 3) Create Restaurants (tenants)
        // If you already seed restaurants elsewhere, keep that and just query them.
        Restaurant restaurant1;
        Restaurant restaurant2;

        if (!context.Restaurants.Any())
        {
            restaurant1 = new Restaurant
            {
                Name = "Restaurant 1",
                IsActive = true
            };

            restaurant2 = new Restaurant
            {
                Name = "Restaurant 2",
                IsActive = true
            };

            context.Restaurants.AddRange(restaurant1, restaurant2);
            await context.SaveChangesAsync();
        }
        else
        {
            restaurant1 = context.Restaurants.First();
            restaurant2 = context.Restaurants.Skip(1).FirstOrDefault() ?? context.Restaurants.First();
        }

        // 4) Create Tenant Admin per restaurant
        var tenantAdmin1 = await CreateUserAsync(
            userManager,
            username: "admin1",
            password: "admin123",
            role: AppRoles.Admin,
            displayName: "Tenant Admin (R1)",
            restaurantId: restaurant1.Id
        );

        var tenantAdmin2 = await CreateUserAsync(
            userManager,
            username: "admin2",
            password: "admin123",
            role: AppRoles.Admin,
            displayName: "Tenant Admin (R2)",
            restaurantId: restaurant2.Id
        );

        // 5) Seed your existing users (these should be tenant users)
        // Pick ONE restaurant for these sample users, otherwise make duplicates per restaurant.
        await CreateUserAsync(userManager, "admin", "admin123", AppRoles.Admin, "System Admin", restaurant1.Id);
        await CreateUserAsync(userManager, "chef", "chef123", AppRoles.Kitchen, "Kitchen User", restaurant1.Id);
        await CreateUserAsync(userManager, "waiter", "waiter123", AppRoles.Waiter, "Waiter User", restaurant1.Id);
        await CreateUserAsync(userManager, "billing", "billing123", AppRoles.Billing, "Billing User", restaurant1.Id);

        // 6) Seed tenant data WITH RestaurantId (important)
        // Categories
        if (!context.MenuCategories.Any())
        {
            context.MenuCategories.AddRange(
                new MenuCategory { Name = "Main Course", RestaurantId = restaurant1.Id },
                new MenuCategory { Name = "Sides", RestaurantId = restaurant1.Id },
                new MenuCategory { Name = "Drinks", RestaurantId = restaurant1.Id }
            );

            await context.SaveChangesAsync();
        }

        // Items
        if (!context.MenuItems.Any())
        {
            var mainCourse = context.MenuCategories.First(x => x.Name == "Main Course" && x.RestaurantId == restaurant1.Id);
            var sides = context.MenuCategories.First(x => x.Name == "Sides" && x.RestaurantId == restaurant1.Id);
            var drinks = context.MenuCategories.First(x => x.Name == "Drinks" && x.RestaurantId == restaurant1.Id);

            context.MenuItems.AddRange(
                new MenuItem { Name = "Burger", MenuCategoryId = mainCourse.Id, Price = 12.99m, Available = true, RestaurantId = restaurant1.Id },
                new MenuItem { Name = "Pizza", MenuCategoryId = mainCourse.Id, Price = 15.50m, Available = true, RestaurantId = restaurant1.Id },
                new MenuItem { Name = "Fries", MenuCategoryId = sides.Id, Price = 4.99m, Available = true, RestaurantId = restaurant1.Id },
                new MenuItem { Name = "Coke", MenuCategoryId = drinks.Id, Price = 2.99m, Available = true, RestaurantId = restaurant1.Id }
            );

            await context.SaveChangesAsync();
        }

        // Tables
        if (!context.RestaurantTables.Any())
        {
            context.RestaurantTables.AddRange(
                new RestaurantTable { Number = "T1", Seats = 4, Status = "Available", RestaurantId = restaurant1.Id },
                new RestaurantTable { Number = "T2", Seats = 2, Status = "Occupied", RestaurantId = restaurant1.Id },
                new RestaurantTable { Number = "T3", Seats = 6, Status = "Reserved", RestaurantId = restaurant1.Id },
                new RestaurantTable { Number = "T4", Seats = 4, Status = "Available", RestaurantId = restaurant1.Id }
            );

            await context.SaveChangesAsync();
        }

        // Orders
        if (!context.Orders.Any())
        {
            var burger = context.MenuItems.First(x => x.Name == "Burger" && x.RestaurantId == restaurant1.Id);
            var fries = context.MenuItems.First(x => x.Name == "Fries" && x.RestaurantId == restaurant1.Id);
            var coke = context.MenuItems.First(x => x.Name == "Coke" && x.RestaurantId == restaurant1.Id);

            var order1 = new Order
            {
                Table = "T1",
                Total = 30.97m,
                Status = "Preparing",
                CreatedAt = DateTime.UtcNow,
                RestaurantId = restaurant1.Id,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem { MenuItemId = burger.Id, Quantity = 2, UnitPrice = burger.Price, TotalPrice = burger.Price * 2 },
                    new OrderItem { MenuItemId = fries.Id, Quantity = 1, UnitPrice = fries.Price, TotalPrice = fries.Price },
                    new OrderItem { MenuItemId = coke.Id, Quantity = 1, UnitPrice = coke.Price, TotalPrice = coke.Price }
                }
            };

            var order2 = new Order
            {
                Table = "T2",
                Total = 15.50m,
                Status = "Ready",
                CreatedAt = DateTime.UtcNow,
                RestaurantId = restaurant1.Id,
                OrderItems = new List<OrderItem>()
            };

            context.Orders.AddRange(order1, order2);
            await context.SaveChangesAsync();
        }
    }

    private static async Task<ApplicationUser> CreateUserAsync(
        UserManager<ApplicationUser> userManager,
        string username,
        string password,
        string role,
        string displayName,
        int? restaurantId)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user != null)
            return user;

        user = new ApplicationUser
        {
            UserName = username,
            DisplayName = displayName,
            RestaurantId = restaurantId
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create user {username}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign role {role} to user {username}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }

        // IMPORTANT: RestaurantId claim for tenant resolution (your CurrentTenantService reads this)
        if (restaurantId.HasValue)
        {
            var claims = await userManager.GetClaimsAsync(user);
            if (!claims.Any(c => c.Type == "RestaurantId"))
            {
                await userManager.AddClaimAsync(user, new Claim("RestaurantId", restaurantId.Value.ToString()));
            }
        }

        return user;
    }
}