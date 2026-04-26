

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaas.Infrastructure.Services;


public class PaymentService : IPaymentService
{
 private readonly ApplicationDbContext _context;
  private readonly IActivityLogService _activityLogService;

public PaymentService(ApplicationDbContext context, IActivityLogService activityLogService)
{
    _context = context;
    _activityLogService = activityLogService;
}

    public IEnumerable<PaymentDto> GetAll()
    {
    return _context.Payments.Include(x=>x.Order)
        .OrderByDescending(x=>x.Id)
        .Select(x=> new PaymentDto
        {
           Id=x.Id,
           OrderId=x.OrderId,
           Table=x.Order!= null? x.Order.Table:string.Empty,
           Amount=x.Amount,
           TipAmount = x.TipAmount,
           CashAmount = x.CashAmount,
           CardAmount = x.CardAmount,
           QrAmount = x.QrAmount,
           PaymentMethod=x.PaymentMethod,
           PaymentStatus=x.PaymentStatus,
           CreatedAt=x.CreatedAt,
           PaidAt=x.PaidAt
        })
        .ToList();
     }
    public PaymentDto? GetById(int id)
    {
        var payment= _context.Payments.
        Include(x=>x.Order)
        .FirstOrDefault(x=>x.Id==id);
        if(payment==null){return null;}
        return new PaymentDto
        {
            Id=payment.Id,
            OrderId=payment.OrderId,
            Table=payment.Order != null ? payment.Order.Table : string.Empty,
            Amount=payment.Amount,
            TipAmount = payment.TipAmount,
            CashAmount = payment.CashAmount,
            CardAmount = payment.CardAmount,
            QrAmount = payment.QrAmount,
            PaymentMethod=payment.PaymentMethod,
            PaymentStatus=payment.PaymentStatus,
            CreatedAt=payment.CreatedAt,
            PaidAt=payment.PaidAt

        };
    }
    public async Task<PaymentDto> Create(PaymentDto dto)
    {
        var paymentMethod = ResolvePaymentMethod(dto);

        var entity = new Payment
        {
            OrderId = dto.OrderId,
            Amount = dto.Amount,
            TipAmount = dto.TipAmount,
            CashAmount = dto.CashAmount,
            CardAmount = dto.CardAmount,
            QrAmount = dto.QrAmount,
            PaymentMethod = paymentMethod,
            PaymentStatus = dto.PaymentStatus,
            CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
            PaidAt = dto.PaymentStatus == "Paid" ? DateTime.UtcNow : dto.PaidAt
        };

        _context.Payments.Add(entity);
        await _context.SaveChangesAsync();
        await ApplySettlementStateAsync(entity.OrderId, entity.PaymentStatus);

        var paymentBreakdown = BuildPaymentBreakdown(entity);

        await _activityLogService.LogAsync(
            "Payment Created",
            "Payment",
            entity.Id.ToString(),
            $"Order #{entity.OrderId} marked as {entity.PaymentStatus} with method {entity.PaymentMethod}. {paymentBreakdown}"
        );

        return GetById(entity.Id)!;
    }
    
    public bool Update(int id, PaymentDto dto)
    {
        var entity = _context.Payments.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        entity.Amount = dto.Amount;
        entity.TipAmount = dto.TipAmount;
        entity.CashAmount = dto.CashAmount;
        entity.CardAmount = dto.CardAmount;
        entity.QrAmount = dto.QrAmount;
        entity.PaymentMethod = ResolvePaymentMethod(dto);
        entity.PaymentStatus = dto.PaymentStatus;
        entity.PaidAt = dto.PaymentStatus == "Paid" ? DateTime.UtcNow : dto.PaidAt;

        _context.SaveChanges();
        return true;
    }

    public bool Delete(int id)
    {
        var entity = _context.Payments.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        _context.Payments.Remove(entity);
        _context.SaveChanges();
        return true;
    }

    private static string ResolvePaymentMethod(PaymentDto dto)
    {
        var activeMethods = 0;
        activeMethods += dto.CashAmount > 0 ? 1 : 0;
        activeMethods += dto.CardAmount > 0 ? 1 : 0;
        activeMethods += dto.QrAmount > 0 ? 1 : 0;

        if (activeMethods > 1)
        {
            return "Split Payment";
        }

        if (dto.CashAmount > 0)
        {
            return "Cash";
        }

        if (dto.CardAmount > 0)
        {
            return "Card";
        }

        if (dto.QrAmount > 0)
        {
            return "QR Payment";
        }

        return string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Cash" : dto.PaymentMethod.Trim();
    }

    private static string BuildPaymentBreakdown(Payment payment)
    {
        var parts = new List<string>();

        if (payment.CashAmount > 0)
        {
            parts.Add($"Cash {payment.CashAmount:0.00}");
        }

        if (payment.CardAmount > 0)
        {
            parts.Add($"Card {payment.CardAmount:0.00}");
        }

        if (payment.QrAmount > 0)
        {
            parts.Add($"QR {payment.QrAmount:0.00}");
        }

        if (payment.TipAmount > 0)
        {
            parts.Add($"Tip {payment.TipAmount:0.00}");
        }

        return parts.Count == 0 ? $"Amount {payment.Amount:0.00}" : string.Join(", ", parts);
    }

    private async Task ApplySettlementStateAsync(int orderId, string paymentStatus)
    {
        if (!string.Equals(paymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == orderId);
        if (order == null)
        {
            return;
        }

        order.Status = "Paid";

        if (!IsVirtualServiceTable(order.Table))
        {
            var table = await _context.RestaurantTables.FirstOrDefaultAsync(x => x.Number.ToLower() == order.Table.ToLower());
            if (table != null)
            {
                table.Status = "Available";
            }
        }

        await _context.SaveChangesAsync();
    }

    private static bool IsVirtualServiceTable(string tableNumber)
    {
        var normalized = (tableNumber ?? string.Empty).Trim().ToLowerInvariant();
        return normalized == "takeaway" || normalized == "dine-in";
    }

}
