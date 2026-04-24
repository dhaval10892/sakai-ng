public static class AppRoles
{
    public const string SuperAdmin = "SuperAdmin"; // global, not tied to a restaurant

    // Tenant roles (inside a restaurant)
    public const string Admin = "Admin";           // Tenant Admin
    public const string Kitchen = "Kitchen";
    public const string Waiter = "Waiter";
    public const string Billing = "Billing";
}