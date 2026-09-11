using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/pending-returns")]
public class PendingReturnsController : ControllerBase
{
    private readonly IPendingReturnService _service;

    public PendingReturnsController(IPendingReturnService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<PendingReturnResponse>> CreatePendingReturn([FromBody] PendingReturnRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ContributorName))
            return BadRequest("ContributorName is required.");

        var res = await _service.CreatePendingReturnAsync(request);
        return Ok(res);
    }

    [HttpGet]
    public async Task<ActionResult<List<PendingReturnResponse>>> GetAllPendingReturns()
    {
        var res = await _service.GetAllPendingReturnsAsync();
        return Ok(res);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<List<PendingReturnResponse>>> GetPendingReturnsByEvent(long eventId)
    {
        var res = await _service.GetPendingReturnsByEventAsync(eventId);
        return Ok(res);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PendingReturnResponse>> UpdatePendingReturn(long id, [FromBody] PendingReturnRequest request)
    {
        var res = await _service.UpdatePendingReturnAsync(id, request);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePendingReturn(long id)
    {
        await _service.DeletePendingReturnAsync(id);
        return Ok(new { message = "Pending return deleted successfully" });
    }
}
