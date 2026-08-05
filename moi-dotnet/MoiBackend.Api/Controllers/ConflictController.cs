using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/conflict")]
public class ConflictController : ControllerBase
{
    private readonly IConflictService _conflictService;

    public ConflictController(IConflictService conflictService)
    {
        _conflictService = conflictService;
    }

    /// <summary>Check conflict without saving to DB (preview only)</summary>
    [HttpPost("check")]
    public async Task<ActionResult<ConflictCheckResponse>> CheckConflict([FromBody] ConflictCheckRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientName))
            return BadRequest("RecipientName is required.");

        var result = await _conflictService.CheckConflictAsync(request);
        return Ok(result);
    }

    /// <summary>Check conflict AND save the result to DB</summary>
    [HttpPost]
    public async Task<ActionResult<ConflictCheckResponse>> CheckAndSaveConflict([FromBody] ConflictCheckRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientName))
            return BadRequest("RecipientName is required.");

        var result = await _conflictService.CheckAndSaveConflictAsync(request);
        return Ok(result);
    }

    /// <summary>Get all saved conflict records</summary>
    [HttpGet]
    public async Task<ActionResult<List<ConflictCheckResponse>>> GetAllConflicts()
    {
        var records = await _conflictService.GetAllConflictsAsync();
        return Ok(records);
    }

    /// <summary>Get conflict records by event</summary>
    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<List<ConflictCheckResponse>>> GetConflictsByEvent(long eventId)
    {
        var records = await _conflictService.GetConflictsByEventAsync(eventId);
        return Ok(records);
    }

    /// <summary>Delete a conflict record</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteConflict(long id)
    {
        await _conflictService.DeleteConflictAsync(id);
        return NoContent();
    }
}
