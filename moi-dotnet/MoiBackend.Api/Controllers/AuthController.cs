using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.Models;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly MoiDbContext _context;

        public AuthController(MoiDbContext context)
        {
            _context = context;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new { success = false, message = "Username and Password are required" });
            }

            var cleanUser = req.Username.Trim().ToLower();

            // Find user in PostgreSQL users table
            var user = await _context.Set<User>()
                .FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUser && u.IsActive);

            if (user == null || user.PasswordHash != req.Password.Trim())
            {
                return Unauthorized(new { success = false, message = "Invalid login credentials" });
            }

            return Ok(new
            {
                success = true,
                token = $"jwt_token_{user.Id}_{DateTime.UtcNow.Ticks}",
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    fullName = user.FullName,
                    role = user.Role,
                    privilegesJson = user.PrivilegesJson
                }
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Set<User>().ToListAsync();
            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] User newUser)
        {
            var exists = await _context.Set<User>().AnyAsync(u => u.Username.ToLower() == newUser.Username.Trim().ToLower());
            if (exists)
            {
                return BadRequest(new { message = "Username already exists" });
            }

            _context.Set<User>().Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(newUser);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            var user = await _context.Set<User>().FindAsync(id);
            if (user == null) return NotFound();

            _context.Set<User>().Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }
    }
}
