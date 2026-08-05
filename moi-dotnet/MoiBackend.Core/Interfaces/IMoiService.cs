using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;

namespace MoiBackend.Core.Interfaces;

public interface IMoiService
{
    Task<List<Event>> GetAllEventsAsync();
    Task<Event> CreateEventAsync(Event eventEntity);
    Task<Event> UpdateEventAsync(long id, Event eventEntity);
    Task DeleteEventAsync(long eventId);
    Task<MoiResponse> RecordMoiAsync(MoiRequest request);
    Task<MoiResponse> UpdateMoiAsync(long transactionId, MoiRequest request);
    Task DeleteMoiAsync(long transactionId);
    Task<List<MoiResponse>> GetTransactionsByEventAsync(long eventId);
    Task<List<MoiResponse>> GetAllTransactionsAsync();
    Task<List<string>> GetAllVillagesAsync();
}
