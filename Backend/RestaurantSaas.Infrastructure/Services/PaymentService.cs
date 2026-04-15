

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
            PaymentMethod=payment.PaymentMethod,
            PaymentStatus=payment.PaymentStatus,
            CreatedAt=payment.CreatedAt,
            PaidAt=payment.PaidAt

        };
    }
    public async Task<PaymentDto> Create(PaymentDto dto)
    {
        var entity = new Payment
        {
            OrderId = dto.OrderId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            PaymentStatus = dto.PaymentStatus,
            CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
            PaidAt = dto.PaymentStatus == "Paid" ? DateTime.UtcNow : dto.PaidAt
        };

        _context.Payments.Add(entity);
        _context.SaveChanges();
await _activityLogService.LogAsync(
    "Payment Created",
    "Payment",
    entity.Id.ToString(),
    $"Order #{entity.OrderId} marked as {entity.PaymentStatus} with method {entity.PaymentMethod}."
);        

        return GetById(entity.Id)!;
    }
    
    public bool Update(int id, PaymentDto dto)
    {
        var entity = _context.Payments.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        entity.Amount = dto.Amount;
        entity.PaymentMethod = dto.PaymentMethod;
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

}