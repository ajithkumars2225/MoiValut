using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/moi")]
public class MoiController : ControllerBase
{
    private readonly IMoiService _moiService;

    public MoiController(IMoiService moiService)
    {
        _moiService = moiService;
    }

    [HttpPost]
    public async Task<ActionResult<MoiResponse>> RecordMoiTransaction([FromBody] MoiRequest request)
    {
        var response = await _moiService.RecordMoiAsync(request);
        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<List<MoiResponse>>> GetAllTransactions()
    {
        var response = await _moiService.GetAllTransactionsAsync();
        return Ok(response);
    }

    [HttpGet("villages")]
    public async Task<ActionResult<List<string>>> GetAllVillages()
    {
        var villages = await _moiService.GetAllVillagesAsync();
        return Ok(villages);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MoiResponse>> UpdateMoiTransaction(long id, [FromBody] MoiRequest request)
    {
        var response = await _moiService.UpdateMoiAsync(id, request);
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMoiTransaction(long id)
    {
        await _moiService.DeleteMoiAsync(id);
        return Ok();
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<List<MoiResponse>>> GetTransactionsForEvent(long eventId)
    {
        var response = await _moiService.GetTransactionsByEventAsync(eventId);
        return Ok(response);
    }
}
