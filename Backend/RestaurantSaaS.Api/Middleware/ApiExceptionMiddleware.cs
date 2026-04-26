using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RestaurantSaaS.Api.Common;

namespace RestaurantSaaS.Api.Middleware;

public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception while processing {Path}", context.Request.Path);
            await WriteErrorResponse(context, exception);
        }
    }

    private async Task WriteErrorResponse(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An unexpected server error occurred. Please try again.";

        switch (exception)
        {
            case ArgumentException:
            case InvalidOperationException:
                statusCode = HttpStatusCode.BadRequest;
                message = exception.Message;
                break;
            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                message = "You are not authorized to perform this action.";
                break;
            case DbUpdateException:
                statusCode = HttpStatusCode.BadRequest;
                message = "The request could not be saved because one or more related records are missing or invalid.";
                break;
        }

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var payload = new
        {
            success = false,
            message,
            details = _environment.IsDevelopment() ? exception.InnerException?.Message ?? exception.Message : null
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
