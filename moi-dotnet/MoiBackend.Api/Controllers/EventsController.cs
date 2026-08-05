using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController : ControllerBase
{
    private readonly IMoiService _moiService;

    public EventsController(IMoiService moiService)
    {
        _moiService = moiService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Event>>> GetAllEvents()
    {
        var events = await _moiService.GetAllEventsAsync();
        return Ok(events);
    }

    [HttpPost]
    public async Task<ActionResult<Event>> CreateEvent([FromBody] Event eventEntity)
    {
        var created = await _moiService.CreateEventAsync(eventEntity);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Event>> UpdateEvent(long id, [FromBody] Event eventEntity)
    {
        var updated = await _moiService.UpdateEventAsync(id, eventEntity);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(long id)
    {
        await _moiService.DeleteEventAsync(id);
        return Ok();
    }
}
