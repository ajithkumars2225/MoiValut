using MoiBackend.Core.DTOs;

namespace MoiBackend.Core.Interfaces;

public interface IGoldEntryService
{
    Task<GoldEntryResponse> RecordGoldEntryAsync(GoldEntryRequest request);
    Task<List<GoldEntryResponse>> GetRecent6EntriesAsync(long eventId);
    Task<List<GoldEntryResponse>> GetAllEntriesByEventAsync(long eventId);
    Task<GoldEntryResponse> UpdateGoldEntryAsync(long id, GoldEntryRequest request);
    Task DeleteGoldEntryAsync(long id);
}
