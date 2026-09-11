using System;

namespace MoiBackend.Core.Models
{
    public class User
    {
        public long Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "user"; // admin or user
        public string PrivilegesJson { get; set; } = "{}";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
