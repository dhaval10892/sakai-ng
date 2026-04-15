using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Domain.Entities;
using Microsoft.AspNetCore.Identity;


namespace RestaurantSaas.Application.DTOs;

public static class DbSeeder
{
    public static async Task SeedAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
    {
       

        string[] roles = ["Admin", "Kitchen", "Waiter", "Billing"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        await CreateUserAsync(userManager, "admin", "admin123", "Admin", "System Admin");
        await CreateUserAsync(userManager, "chef", "chef123", "Kitchen", "Kitchen User");
        await CreateUserAsync(userManager, "waiter", "waiter123", "Waiter", "Waiter User");
        await CreateUserAsync(userManager, "billing", "billing123", "Billing", "Billing User");

        // keep your existing category/menu/table/order/payment seed logic here

        // but remove old AppUser seeding completely


        if (!context.MenuCategories.Any())
        {
            context.MenuCategories.AddRange(
                new MenuCategory { Name = "Main Course" },
                new MenuCategory { Name = "Sides" },
                new MenuCategory { Name = "Drinks" }
            );

            await context.SaveChangesAsync();
        }

        if (!context.MenuItems.Any())
        {
            var mainCourse = context.MenuCategories.First(x => x.Name == "Main Course");
            var sides = context.MenuCategories.First(x => x.Name == "Sides");
            var drinks = context.MenuCategories.First(x => x.Name == "Drinks");

            context.MenuItems.AddRange(
                new MenuItem { Name = "Burger", MenuCategoryId = mainCourse.Id, Price = 12.99m, Available = true },
                new MenuItem { Name = "Pizza", MenuCategoryId = mainCourse.Id, Price = 15.50m, Available = true },
                new MenuItem { Name = "Fries", MenuCategoryId = sides.Id, Price = 4.99m, Available = true },
                new MenuItem { Name = "Coke", MenuCategoryId = drinks.Id, Price = 2.99m, Available = true }
            );

            await context.SaveChangesAsync();
        }

        if (!context.RestaurantTables.Any())
        {
            context.RestaurantTables.AddRange(
                new RestaurantTable { Number = "T1", Seats = 4, Status = "Available" },
                new RestaurantTable { Number = "T2", Seats = 2, Status = "Occupied" },
                new RestaurantTable { Number = "T3", Seats = 6, Status = "Reserved" },
                new RestaurantTable { Number = "T4", Seats = 4, Status = "Available" }
            );

            await context.SaveChangesAsync();
        }

        if (!context.Orders.Any())
        {
            var burger = context.MenuItems.First(x => x.Name == "Burger");
            var fries = context.MenuItems.First(x => x.Name == "Fries");
            var coke = context.MenuItems.First(x => x.Name == "Coke");

            var order1 = new Order
            {
                Table = "T1",
                Total = 30.97m,
                Status = "Preparing",
                CreatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        MenuItemId = burger.Id,
                        Quantity = 2,
                        UnitPrice = burger.Price,
                        TotalPrice = burger.Price * 2
                    },
                    new OrderItem
                    {
                        MenuItemId = fries.Id,
                        Quantity = 1,
                        UnitPrice = fries.Price,
                        TotalPrice = fries.Price
                    },
                    new OrderItem
                    {
                        MenuItemId = coke.Id,
                        Quantity = 1,
                        UnitPrice = coke.Price,
                        TotalPrice = coke.Price
                    }
                }
            };

            var order2 = new Order
            {
                Table = "T2",
                Total = 15.50m,
                Status = "Ready",
                CreatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>()
            };

            context.Orders.AddRange(order1, order2);
            await context.SaveChangesAsync();
        }


    }
    private static async Task CreateUserAsync(
        UserManager<ApplicationUser> userManager,
        string username,
        string password,
        string role,
        string displayName)
    {
        var user = await userManager.FindByNameAsync(username);

        if (user != null)
            return;

        user = new ApplicationUser
        {
            UserName = username,
            DisplayName = displayName
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
    }
}
