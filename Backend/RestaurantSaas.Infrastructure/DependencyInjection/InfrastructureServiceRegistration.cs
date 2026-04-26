using Microsoft.Extensions.DependencyInjection;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Infrastructure.Services;
using RestaurantSaas.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Infrastructure.Services;
using RestaurantSaaS.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace RestaurantSaas.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public  static IServiceCollection AddInfrastructureServices(this IServiceCollection services, 
    IConfiguration  configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options=>
           options
               .UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
               .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))); 


        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<ITableService,TableService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IMenuCategoryService, MenuCategoryService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService,CurrentUserService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IActivityLogQueryService, ActivityLogQueryService>();
        services.AddScoped<IPaymentQueryService, PaymentQueryService>();
        services.AddScoped<IRestaurantService, RestaurantService>();

        return services;
    }
}
