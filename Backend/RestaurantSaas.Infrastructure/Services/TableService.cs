using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;

namespace RestaurantSaas.Infrastructure.Services;

public class TableService : ITableService
{
    private readonly ApplicationDbContext _context;

    public TableService(ApplicationDbContext context)
    {
        _context=context;
    }
  public  IEnumerable<RestaurantTableDto> GetAll()
    {
        return _context.RestaurantTables.Select(x=> new RestaurantTableDto
        {
            Id=x.Id,
            Number=x.Number,
            Seats=x.Seats,
            Status=x.Status

        }).ToList();
    }
     public RestaurantTableDto? GetById(int id)
    {
        var table = _context.RestaurantTables.FirstOrDefault(x => x.Id == id);

        if (table == null) return null;

        return new RestaurantTableDto
        {
            Id = table.Id,
            Number = table.Number,
            Seats = table.Seats,
            Status = table.Status
        };
    }

    public RestaurantTableDto Create(RestaurantTableDto dto)
    {
        var entity = new RestaurantTable
        {
            Number = dto.Number,
            Seats = dto.Seats,
            Status = dto.Status
        };

        _context.RestaurantTables.Add(entity);
        _context.SaveChanges();

        dto.Id = entity.Id;
        return dto;
    }

    public bool Update(int id, RestaurantTableDto dto)
    {
        var entity = _context.RestaurantTables.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        entity.Number = dto.Number;
        entity.Seats = dto.Seats;
        entity.Status = dto.Status;

        _context.SaveChanges();
        return true;
    }

    public bool Delete(int id)
    {
        var entity = _context.RestaurantTables.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        _context.RestaurantTables.Remove(entity);
        _context.SaveChanges();
        return true;
    }
}