using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Infrastructure.Persistence;

namespace RestaurantSaaS.Infrastructure.Services;

public class PaymentQueryService : IPaymentQueryService
{
    private readonly ApplicationDbContext _context;

    public PaymentQueryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<PaymentDto>> GetPagedAsync(PaymentQueryDto query)
    {
        var paymentsQuery = _context.Payments
            .Include(x => x.Order)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.PaymentMethod) && query.PaymentMethod != "All")
        {
            paymentsQuery = paymentsQuery.Where(x => x.PaymentMethod == query.PaymentMethod);
        }

        if (!string.IsNullOrWhiteSpace(query.PaymentStatus) && query.PaymentStatus != "All")
        {
            paymentsQuery = paymentsQuery.Where(x => x.PaymentStatus == query.PaymentStatus);
        }

        if (query.StartDate.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(x => x.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            var endOfDay = query.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            paymentsQuery = paymentsQuery.Where(x => x.CreatedAt <= endOfDay);
        }

        var totalRecords = await paymentsQuery.CountAsync();

        var items = await paymentsQuery
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new PaymentDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                Table = x.Order != null ? x.Order.Table : string.Empty,
                Amount = x.Amount,
                TipAmount = x.TipAmount,
                CashAmount = x.CashAmount,
                CardAmount = x.CardAmount,
                QrAmount = x.QrAmount,
                PaymentMethod = x.PaymentMethod,
                PaymentStatus = x.PaymentStatus,
                CreatedAt = x.CreatedAt,
                PaidAt = x.PaidAt
            })
            .ToListAsync();

        return new PagedResultDto<PaymentDto>
        {
            Items = items,
            TotalRecords = totalRecords,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }
}
