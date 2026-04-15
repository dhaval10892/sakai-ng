using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Infrastructure.Persistence;

namespace RestaurantSaaS.Infrastructure.Services;

public class ActivityLogQueryService : IActivityLogQueryService
{
    private readonly ApplicationDbContext _context;

    public ActivityLogQueryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<ActivityLogDto>> GetPagedAsync(ActivityLogQueryDto query)
    {
        var logsQuery = _context.ActivityLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Action) && query.Action != "All")
        {
            logsQuery = logsQuery.Where(x => x.Action == query.Action);
        }

        if (!string.IsNullOrWhiteSpace(query.EntityName) && query.EntityName != "All")
        {
            logsQuery = logsQuery.Where(x => x.EntityName == query.EntityName);
        }

        if (!string.IsNullOrWhiteSpace(query.PerformedBy))
        {
            var search = query.PerformedBy.Trim().ToLower();
            logsQuery = logsQuery.Where(x => (x.PerformedBy ?? "").ToLower().Contains(search));
        }

        if (query.StartDate.HasValue)
        {
            logsQuery = logsQuery.Where(x => x.PerformedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            var endOfDay = query.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            logsQuery = logsQuery.Where(x => x.PerformedAt <= endOfDay);
        }

        var totalRecords = await logsQuery.CountAsync();

        var items = await logsQuery
            .OrderByDescending(x => x.PerformedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new ActivityLogDto
            {
                Id = x.Id,
                Action = x.Action,
                EntityName = x.EntityName,
                EntityId = x.EntityId,
                PerformedBy = x.PerformedBy,
                PerformedAt = x.PerformedAt,
                Details = x.Details
            })
            .ToListAsync();

        return new PagedResultDto<ActivityLogDto>
        {
            Items = items,
            TotalRecords = totalRecords,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }
}