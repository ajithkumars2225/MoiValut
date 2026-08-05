namespace MoiBackend.Core.Interfaces;

public interface IReportService
{
    Task<byte[]> GenerateOverallWordReportAsync(long eventId);
}
