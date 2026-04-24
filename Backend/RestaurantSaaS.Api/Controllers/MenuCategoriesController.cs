using System.Net.NetworkInformation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection.KeyManagement.Internal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;


namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")] 
[Authorize]
public class MenuCategoriesController : ControllerBase
{
    private readonly IMenuCategoryService _menuCatrgoriesService;
private CurrentTenantService _tenant;
    public MenuCategoriesController(IMenuCategoryService menuCategoryService,CurrentTenantService tenant)
    {
        _menuCatrgoriesService=menuCategoryService;
        _tenant=tenant;
    }

    [HttpGet]
    public IActionResult Get()
    {
           var restaurantId = _tenant.RestaurantId;

        if (restaurantId == null)
            return Unauthorized();
        return Ok(_menuCatrgoriesService.GetAll());
    }
    [HttpGet("{id}")]
    public  IActionResult GetById(int id)
    {
        var category=_menuCatrgoriesService.GetById(id);
        if(category==null) return NotFound();
        return Ok(category);
    }
    
    [HttpPost]
    public IActionResult Create([FromBody]MenuCategoryDto dto)
    {
            var created=_menuCatrgoriesService.Create(dto);
            if(String.IsNullOrWhiteSpace(dto.Name))
             return BadRequest(" Category Name is required ");
             if(created==null) return StatusCode(500,"Created is null");

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
[HttpPut("{id}")]
    public IActionResult Update(int id,[FromBody]MenuCategoryDto dto)
    {
          if(String.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Category Name is required");
          var updated=_menuCatrgoriesService.Update(id,dto);
          if(!updated) return NotFound();
          return NoContent();

    }
[HttpDelete("{id}")]
public IActionResult Delete(int id)
    {
        try
        {
        var category=_menuCatrgoriesService.Delete(id);
        if(!category)return NotFound();
        return NoContent();
            
        }
        catch (Exception ex)
        {
            return StatusCode(500,ex);            
            
        }
    }

}
