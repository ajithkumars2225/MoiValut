using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/gold")]
public class GoldController : ControllerBase
{
    private readonly IGoldEntryService _goldEntryService;

    public GoldController(IGoldEntryService goldEntryService)
    {
        _goldEntryService = goldEntryService;
    }

    [HttpPost]
    public async Task<ActionResult<GoldEntryResponse>> RecordGoldEntry([FromBody] GoldEntryRequest request)
    {
        var response = await _goldEntryService.RecordGoldEntryAsync(request);
        return Ok(response);
    }

    [HttpGet("event/{eventId}/recent")]
    public async Task<ActionResult<List<GoldEntryResponse>>> GetRecentEntries(long eventId)
    {
        var response = await _goldEntryService.GetRecent6EntriesAsync(eventId);
        return Ok(response);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<List<GoldEntryResponse>>> GetAllEntriesByEvent(long eventId)
    {
        var response = await _goldEntryService.GetAllEntriesByEventAsync(eventId);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GoldEntryResponse>> UpdateGoldEntry(long id, [FromBody] GoldEntryRequest request)
    {
        var response = await _goldEntryService.UpdateGoldEntryAsync(id, request);
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoldEntry(long id)
    {
        await _goldEntryService.DeleteGoldEntryAsync(id);
        return Ok();
    }
}
