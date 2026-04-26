using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;

namespace RestaurantSaaS.Infrastructure.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ActivityLogService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task LogAsync(string action, string entityName, string entityId, string? details = null, int? restaurantId = null)
    {
        var log = new ActivityLog
        {
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            PerformedBy = _currentUserService.Username ?? "system",
            PerformedAt = DateTime.UtcNow,
            Details = details,
            RestaurantId = restaurantId ?? 0
        };

        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
