using MoiBackend.Core.DTOs;

namespace MoiBackend.Core.Interfaces;

public interface IGivenMoiService
{
    Task<GivenMoiResponse> RecordGivenMoiAsync(GivenMoiRequest request);
    Task<GivenMoiResponse> UpdateGivenMoiAsync(long id, GivenMoiRequest request);
    Task DeleteGivenMoiAsync(long id);
    Task<List<GivenMoiResponse>> GetAllGivenMoiAsync();
    Task<List<GivenMoiResponse>> GetGivenMoiByEventAsync(long eventId);
}
