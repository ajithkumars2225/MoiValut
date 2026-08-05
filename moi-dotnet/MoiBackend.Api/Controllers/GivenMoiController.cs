using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/given-moi")]
public class GivenMoiController : ControllerBase
{
    private readonly IGivenMoiService _givenMoiService;

    public GivenMoiController(IGivenMoiService givenMoiService)
    {
        _givenMoiService = givenMoiService;
    }

    [HttpPost]
    public async Task<ActionResult<GivenMoiResponse>> RecordGivenMoi([FromBody] GivenMoiRequest request)
    {
        var response = await _givenMoiService.RecordGivenMoiAsync(request);
        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<List<GivenMoiResponse>>> GetAllGivenMoi()
    {
        var response = await _givenMoiService.GetAllGivenMoiAsync();
        return Ok(response);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<List<GivenMoiResponse>>> GetGivenMoiByEvent(long eventId)
    {
        var response = await _givenMoiService.GetGivenMoiByEventAsync(eventId);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GivenMoiResponse>> UpdateGivenMoi(long id, [FromBody] GivenMoiRequest request)
    {
        var response = await _givenMoiService.UpdateGivenMoiAsync(id, request);
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGivenMoi(long id)
    {
        await _givenMoiService.DeleteGivenMoiAsync(id);
        return Ok();
    }
}
