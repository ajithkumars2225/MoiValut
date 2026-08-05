using Microsoft.AspNetCore.Mvc;
using MoiBackend.Core.Interfaces;

namespace MoiBackend.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("overall/word")]
    public async Task<IActionResult> DownloadOverallWordReport([FromQuery] long eventId)
    {
        try
        {
            byte[] fileContent = await _reportService.GenerateOverallWordReportAsync(eventId);
            string fileName = $"Overall_Report_{eventId}.docx";
            string contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            return File(fileContent, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
